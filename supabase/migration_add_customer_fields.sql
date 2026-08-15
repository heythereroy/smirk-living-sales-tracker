-- Run this once in the Supabase SQL Editor before using the new
-- checkout customer form. Requires owner/service-role access, which
-- the app's anon key does not have.

alter table orders
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text;
