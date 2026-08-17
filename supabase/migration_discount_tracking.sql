-- Run this once in the Supabase SQL Editor. Adds discount provenance
-- tracking to orders (needed for the manual flat/percentage discount
-- system and P&L discount reporting), and links archived_events back
-- to its source event for the detailed archive view.

alter table orders
  add column if not exists discount_type text check (discount_type in ('flat', 'percentage', 'code')),
  add column if not exists discount_value numeric(12,2),
  add column if not exists final_total numeric(12,2);

-- Backfill final_total for existing rows so it's never null going
-- forward (new rows always set it explicitly on insert).
update orders set final_total = total where final_total is null;

-- events.id is uuid (not bigint) on this project's live schema.
alter table archived_events
  add column if not exists event_id uuid references events(id);
create index if not exists idx_archived_events_event_id on archived_events (event_id);
