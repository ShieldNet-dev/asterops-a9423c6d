-- Alerting + agent health + cert thresholds

alter table public.servers
  add column if not exists webhook_url text,
  add column if not exists alert_email text,
  add column if not exists cert_warn_days integer not null default 14,
  add column if not exists cert_critical_days integer not null default 3;

-- Recent reload outcomes (one row per agent-reported config apply)
create table if not exists public.agent_reloads (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null,
  config_id uuid,
  config_version integer,
  outcome text not null check (outcome in ('applied','failed','rollback')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists agent_reloads_server_idx on public.agent_reloads(server_id, created_at desc);
alter table public.agent_reloads enable row level security;

drop policy if exists "Owner can view agent_reloads" on public.agent_reloads;
create policy "Owner can view agent_reloads" on public.agent_reloads
  for select using (exists (select 1 from public.servers s where s.id = agent_reloads.server_id and s.owner_id = auth.uid()));

drop policy if exists "Nobody updates agent_reloads" on public.agent_reloads;
create policy "Nobody updates agent_reloads" on public.agent_reloads for update using (false);
drop policy if exists "Nobody deletes agent_reloads" on public.agent_reloads;
create policy "Nobody deletes agent_reloads" on public.agent_reloads for delete using (false);

-- Notifications (cert expiry, reload failures, tls failures)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  server_id uuid,
  kind text not null,
  severity text not null check (severity in ('info','warn','critical')),
  title text not null,
  message text,
  meta jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  delivered_webhook boolean not null default false,
  delivered_email boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_server_idx on public.notifications(server_id, created_at desc);
create index if not exists notifications_unack_idx on public.notifications(acknowledged_at) where acknowledged_at is null;
alter table public.notifications enable row level security;

drop policy if exists "Owner can view notifications" on public.notifications;
create policy "Owner can view notifications" on public.notifications
  for select using (
    server_id is null and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
    or exists (select 1 from public.servers s where s.id = notifications.server_id and s.owner_id = auth.uid())
  );

drop policy if exists "Owner can ack notifications" on public.notifications;
create policy "Owner can ack notifications" on public.notifications
  for update using (
    exists (select 1 from public.servers s where s.id = notifications.server_id and s.owner_id = auth.uid())
  );

drop policy if exists "Nobody deletes notifications" on public.notifications;
create policy "Nobody deletes notifications" on public.notifications for delete using (false);
