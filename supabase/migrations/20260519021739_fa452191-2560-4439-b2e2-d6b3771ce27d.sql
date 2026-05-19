
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- auto create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- servers
create type public.server_status as enum ('pending', 'online', 'degraded', 'offline');

create table public.servers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  hostname text,
  region text,
  description text,
  -- agents authenticate using a bearer token; we store only the SHA-256 hash
  enrollment_token_hash text,
  agent_token_hash text,
  agent_version text,
  asterisk_version text,
  status public.server_status not null default 'pending',
  last_seen_at timestamptz,
  active_calls int not null default 0,
  cert_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.servers enable row level security;
create index on public.servers (owner_id);
create index on public.servers (agent_token_hash);

create policy "Owner can view servers" on public.servers
  for select using (auth.uid() = owner_id);
create policy "Owner can insert servers" on public.servers
  for insert with check (auth.uid() = owner_id);
create policy "Owner can update servers" on public.servers
  for update using (auth.uid() = owner_id);
create policy "Owner can delete servers" on public.servers
  for delete using (auth.uid() = owner_id);

-- endpoints
create table public.endpoints (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  extension text not null,
  display_name text,
  context text not null default 'from-internal',
  password_hash text, -- never store cleartext SIP passwords
  codecs text[] not null default array['ulaw','alaw','g722','opus']::text[],
  transport text not null default 'transport-tls',
  tls_required boolean not null default true,
  srtp_required boolean not null default true,
  max_contacts int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (server_id, extension)
);
alter table public.endpoints enable row level security;
create index on public.endpoints (server_id);

create policy "Owner can view endpoints" on public.endpoints
  for select using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
create policy "Owner can write endpoints" on public.endpoints
  for all using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));

-- trunks
create table public.trunks (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  name text not null,
  provider text,
  host text not null,
  port int not null default 5060,
  username text,
  password_hash text,
  transport text not null default 'transport-tls',
  srtp_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (server_id, name)
);
alter table public.trunks enable row level security;
create index on public.trunks (server_id);

create policy "Owner can view trunks" on public.trunks
  for select using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
create policy "Owner can write trunks" on public.trunks
  for all using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));

-- pjsip_configs (versioned rendered files)
create type public.config_state as enum ('draft', 'pending', 'applied', 'failed', 'reverted');

create table public.pjsip_configs (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  version int not null,
  rendered_text text not null,
  state public.config_state not null default 'draft',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique (server_id, version)
);
alter table public.pjsip_configs enable row level security;
create index on public.pjsip_configs (server_id, version desc);

create policy "Owner can view pjsip_configs" on public.pjsip_configs
  for select using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
create policy "Owner can insert pjsip_configs" on public.pjsip_configs
  for insert with check (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
create policy "Owner can update pjsip_configs" on public.pjsip_configs
  for update using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));

-- tls_certs metadata
create table public.tls_certs (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  subject text not null,
  issuer text,
  fingerprint_sha256 text not null,
  not_before timestamptz,
  not_after timestamptz not null,
  is_self_signed boolean not null default false,
  -- pem bodies stored as TEXT; the application is responsible for never sending
  -- raw private keys here. Only public cert PEM may be stored.
  cert_pem text,
  created_at timestamptz not null default now()
);
alter table public.tls_certs enable row level security;
create index on public.tls_certs (server_id);

create policy "Owner can view tls_certs" on public.tls_certs
  for select using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
create policy "Owner can write tls_certs" on public.tls_certs
  for all using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));

-- hardening profile per server
create table public.hardening_profiles (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null unique references public.servers(id) on delete cascade,
  fail2ban_enabled boolean not null default true,
  iptables_enabled boolean not null default true,
  ami_lockdown boolean not null default true,
  tls_only boolean not null default true,
  srtp_only boolean not null default true,
  rtp_port_start int not null default 10000,
  rtp_port_end int not null default 20000,
  ssh_hardening boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.hardening_profiles enable row level security;

create policy "Owner can view hardening_profiles" on public.hardening_profiles
  for select using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
create policy "Owner can write hardening_profiles" on public.hardening_profiles
  for all using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));

-- call_records (immutable audit)
create type public.call_disposition as enum ('ANSWERED','NO_ANSWER','BUSY','FAILED','REJECTED','CONGESTION','UNKNOWN');

create table public.call_records (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  uniqueid text not null,
  linkedid text,
  src text,
  dst text,
  channel text,
  dst_channel text,
  lastapp text,
  lastdata text,
  duration int not null default 0,
  billsec int not null default 0,
  disposition public.call_disposition not null default 'UNKNOWN',
  amaflags text,
  accountcode text,
  encrypted boolean not null default false,
  start_ts timestamptz not null,
  answer_ts timestamptz,
  end_ts timestamptz,
  created_at timestamptz not null default now(),
  unique (server_id, uniqueid)
);
alter table public.call_records enable row level security;
create index on public.call_records (server_id, start_ts desc);
create index on public.call_records (src);
create index on public.call_records (dst);

-- IMMUTABLE: select for owners; no update/delete policies = denied for everyone.
create policy "Owner can view call_records" on public.call_records
  for select using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));

-- explicit deny update/delete for everyone (clarity)
create policy "Nobody can update call_records" on public.call_records
  for update using (false);
create policy "Nobody can delete call_records" on public.call_records
  for delete using (false);

-- audit_events (immutable)
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  server_id uuid references public.servers(id) on delete cascade,
  action text not null,
  target_type text,
  target_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_events enable row level security;
create index on public.audit_events (server_id, created_at desc);
create index on public.audit_events (actor_id, created_at desc);

create policy "Users can view own audit_events" on public.audit_events
  for select using (
    actor_id = auth.uid()
    or exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid())
  );
create policy "Nobody can update audit_events" on public.audit_events
  for update using (false);
create policy "Nobody can delete audit_events" on public.audit_events
  for delete using (false);

-- timestamp trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger touch_servers before update on public.servers
  for each row execute function public.touch_updated_at();
create trigger touch_endpoints before update on public.endpoints
  for each row execute function public.touch_updated_at();
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
