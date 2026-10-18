create table public.whoop_sync_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null check (status in ('running','complete','partial','abandoned')),
 counts jsonb not null default '{}'::jsonb,
 errors jsonb not null default '{}'::jsonb
);
alter table public.whoop_sync_runs enable row level security;
revoke all on public.whoop_sync_runs from public, anon, authenticated;
grant all on public.whoop_sync_runs to service_role;
create unique index whoop_sync_one_running on public.whoop_sync_runs(user_id) where status='running';
create index whoop_sync_user_started on public.whoop_sync_runs(user_id,started_at desc);
