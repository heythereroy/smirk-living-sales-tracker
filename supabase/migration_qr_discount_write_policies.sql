-- Run this once in the Supabase SQL Editor. This is the actual root
-- cause of "Failed to save QR code" — confirmed by testing directly
-- against this project: even a plain paste-a-URL save (no file upload
-- involved) was rejected with "new row violates row-level security
-- policy for table qr_configs". Both qr_configs and discount_codes have
-- RLS enabled with a read policy but no write policy at all, so every
-- insert/update/delete from the app is silently blocked regardless of
-- the storage bucket fix. products and cart were checked too and
-- already have working write policies — only these two tables are
-- affected.

drop policy if exists "Authenticated write qr_configs" on qr_configs;
create policy "Authenticated write qr_configs" on qr_configs
  for insert to authenticated with check (true);

drop policy if exists "Authenticated update qr_configs" on qr_configs;
create policy "Authenticated update qr_configs" on qr_configs
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated delete qr_configs" on qr_configs;
create policy "Authenticated delete qr_configs" on qr_configs
  for delete to authenticated using (true);

drop policy if exists "Authenticated write discount_codes" on discount_codes;
create policy "Authenticated write discount_codes" on discount_codes
  for insert to authenticated with check (true);

drop policy if exists "Authenticated update discount_codes" on discount_codes;
create policy "Authenticated update discount_codes" on discount_codes
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated delete discount_codes" on discount_codes;
create policy "Authenticated delete discount_codes" on discount_codes
  for delete to authenticated using (true);
