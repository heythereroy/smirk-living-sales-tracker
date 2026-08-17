-- Run this once in the Supabase SQL Editor. EventArchive.tsx queries a
-- table that doesn't exist yet on the live DB — without this, the page
-- just shows "No archived events yet" (it degrades gracefully, doesn't
-- crash), but there's nowhere for archived events to actually come from.
--
-- Note: the component as provided is read/delete only — it has no
-- "save current event to archive" button. You'll need to add that
-- separately (e.g. an admin action that snapshots today's totals into
-- this table) if you want to actually populate it.

create table if not exists archived_events (
  id             bigint generated always as identity primary key,
  event_name     text not null,
  event_date     date not null,
  total_revenue  numeric(12,2) not null default 0,
  total_profit   numeric(12,2) not null default 0,
  total_orders   integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table archived_events enable row level security;

drop policy if exists "Public read archived_events" on archived_events;
create policy "Public read archived_events" on archived_events
  for select using (true);

drop policy if exists "Authenticated write archived_events" on archived_events;
create policy "Authenticated write archived_events" on archived_events
  for insert to authenticated with check (true);

drop policy if exists "Authenticated update archived_events" on archived_events;
create policy "Authenticated update archived_events" on archived_events
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated delete archived_events" on archived_events;
create policy "Authenticated delete archived_events" on archived_events
  for delete to authenticated using (true);
