
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null,
  server_id uuid,
  channel text not null check (channel in ('webhook','email')),
  target text,
  status text not null check (status in ('attempted','success','failed','skipped')),
  status_code int,
  error text,
  attempted_at timestamptz not null default now()
);
create index if not exists notification_deliveries_notification_idx on public.notification_deliveries(notification_id);
create index if not exists notification_deliveries_server_idx on public.notification_deliveries(server_id, attempted_at desc);

alter table public.notification_deliveries enable row level security;

create policy "Owner views deliveries"
on public.notification_deliveries for select
using (
  exists (select 1 from public.servers s where s.id = notification_deliveries.server_id and s.owner_id = auth.uid())
);
create policy "Nobody updates deliveries"
on public.notification_deliveries for update using (false);
create policy "Nobody deletes deliveries"
on public.notification_deliveries for delete using (false);
