
-- ============ Roles ============
do $$ begin
  create type public.app_role as enum ('admin', 'operator', 'viewer');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

drop policy if exists "Users view own roles" on public.user_roles;
create policy "Users view own roles" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles" on public.user_roles
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- First signup becomes admin, rest operator
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_count int;
begin
  select count(*) into v_count from public.user_roles;
  if v_count = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'operator') on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute function public.handle_new_user_role();

-- ============ TLS lifecycle ============
do $$ begin
  create type public.cert_source as enum ('uploaded', 'letsencrypt', 'self_signed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cert_state as enum ('pending', 'active', 'failed', 'superseded');
exception when duplicate_object then null; end $$;

alter table public.tls_certs
  add column if not exists source public.cert_source not null default 'uploaded',
  add column if not exists state public.cert_state not null default 'pending',
  add column if not exists domain text,
  add column if not exists le_email text,
  add column if not exists last_error text,
  add column if not exists applied_at timestamptz,
  add column if not exists requested_by uuid;

create index if not exists tls_certs_server_state_idx
  on public.tls_certs (server_id, state);

-- ============ Audit event policies ============
drop policy if exists "Owner can insert audit_events" on public.audit_events;
create policy "Owner can insert audit_events" on public.audit_events
  for insert
  with check (
    (actor_id is null or actor_id = auth.uid())
    and (
      server_id is null
      or exists (select 1 from public.servers s
                 where s.id = audit_events.server_id
                   and s.owner_id = auth.uid())
    )
  );

drop policy if exists "Admins view all audit_events" on public.audit_events;
create policy "Admins view all audit_events" on public.audit_events
  for select using (public.has_role(auth.uid(), 'admin'));
