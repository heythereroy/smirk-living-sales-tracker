-- Run this once in the Supabase SQL Editor. Required for the "upload an
-- image file" option in Admin (Product Manager and QR Manager) to work.
--
-- Why this can't be done from the app itself: bucket creation and storage
-- policies are governed by RLS on storage.buckets / storage.objects, and
-- by default only the service_role key can write to them — confirmed by
-- testing directly against this project: an authenticated request to
-- create the "qr-images" bucket was rejected with
-- "new row violates row-level security policy". The app only ships with
-- the anon key (safe to expose client-side), so this one-time setup step
-- has to run here, as the database owner, which bypasses RLS.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('qr-images', 'qr-images', true)
on conflict (id) do update set public = true;

-- Public read (so the uploaded image URLs work for anyone, e.g. on a
-- printed/shared receipt) + public write (matches "2 trusted users,
-- pop-up event, keep it simple" — no auth-only restriction on uploads).
drop policy if exists "Public read product-images" on storage.objects;
create policy "Public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Public write product-images" on storage.objects;
create policy "Public write product-images" on storage.objects
  for insert with check (bucket_id = 'product-images');

drop policy if exists "Public update product-images" on storage.objects;
create policy "Public update product-images" on storage.objects
  for update using (bucket_id = 'product-images');

drop policy if exists "Public delete product-images" on storage.objects;
create policy "Public delete product-images" on storage.objects
  for delete using (bucket_id = 'product-images');

drop policy if exists "Public read qr-images" on storage.objects;
create policy "Public read qr-images" on storage.objects
  for select using (bucket_id = 'qr-images');

drop policy if exists "Public write qr-images" on storage.objects;
create policy "Public write qr-images" on storage.objects
  for insert with check (bucket_id = 'qr-images');

drop policy if exists "Public update qr-images" on storage.objects;
create policy "Public update qr-images" on storage.objects
  for update using (bucket_id = 'qr-images');

drop policy if exists "Public delete qr-images" on storage.objects;
create policy "Public delete qr-images" on storage.objects
  for delete using (bucket_id = 'qr-images');
