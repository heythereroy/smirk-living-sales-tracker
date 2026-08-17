-- Run this once in the Supabase SQL Editor. Required for the event
-- management system (Start/End Event, per-event P&L). The app only has
-- the anon key, which can't create tables or alter existing ones.
--
-- NOTE: this file originally used a bigint identity primary key. The
-- version actually applied to the live project uses uuid instead (and
-- adds created_by) — corrected here to match reality and to be
-- reproducible if this ever needs to run again elsewhere.

create table if not exists events (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  location              text not null,
  category              text not null check (category in ('Wedding', 'Corporate', 'Festival', 'Popup', 'Other')),
  participants          integer,
  booth_cost            numeric(12,2) not null default 0,
  transportation_cost   numeric(12,2) not null default 0,
  outside_help_cost     numeric(12,2) not null default 0,
  food_drinks_cost      numeric(12,2) not null default 0,
  accommodation_cost    numeric(12,2) not null default 0,
  miscellaneous_cost    numeric(12,2) not null default 0,
  status                text not null default 'active' check (status in ('active', 'ended')),
  created_at            timestamptz not null default now(),
  ended_at              timestamptz,
  created_by            uuid references auth.users(id)
);

-- At most one active event at a time — the app's "Start New Event" flow
-- assumes this (it only shows the button when there's no active event).
create unique index if not exists one_active_event on events ((status)) where status = 'active';

alter table events enable row level security;

drop policy if exists "Public read events" on events;
create policy "Public read events" on events for select using (true);

drop policy if exists "Authenticated write events" on events;
create policy "Authenticated write events" on events
  for insert to authenticated with check (true);

drop policy if exists "Authenticated update events" on events;
create policy "Authenticated update events" on events
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated delete events" on events;
create policy "Authenticated delete events" on events
  for delete to authenticated using (true);

-- Orders get tagged to whichever event was active when they were
-- placed. Nullable: orders placed before this migration have no event.
alter table orders add column if not exists event_id uuid references events(id);
create index if not exists idx_orders_event_id on orders (event_id);
