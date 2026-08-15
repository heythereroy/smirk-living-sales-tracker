# Smirk Living — Sales Tracker

React + TypeScript + Vite + Supabase POS app for the pop-up event.

## Local development

```bash
npm install
npm run dev
```

Env vars live in `.env` (already filled in with the project's Supabase URL/anon key — copy `.env.example` if you need a fresh checkout).

## Before the event: two things need doing in the Supabase dashboard

1. **Enable email OTP (magic link) auth** — Authentication → Providers → Email, and make sure "Confirm email" / magic link sign-in is on. The app calls `signInWithOtp`, which was confirmed working against the live project during build.
2. **Create two public Storage buckets** — `product-images` and `qr-images` — only needed if you want to use the "upload an image file" option in Admin. Pasting an image URL (the recommended path per the spec) works with zero setup.

Everything else (tables, RLS) was already live and is untouched by this app.

## Admin Tools access

Both `@smirkliving.com` users see the Admin Tools nav items (Products, Discounts, QR Manager, Cash Sales) — see `src/config.ts`. To restrict Admin Tools to specific people, list their exact emails in `ADMIN_EMAILS` there.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, "Import Project" → select the repo.
3. Set environment variables (Project Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ALLOWED_EMAIL_DOMAIN` = `smirkliving.com`
4. Deploy. Vite's build output is `dist/` (Vercel auto-detects this for a Vite project).

## Schema note

The live Supabase schema doesn't exactly match the plain-English column names in the original spec (e.g. `qr_configs.qr_image_url` not `image_url`, `orders.discount_code_used` not `discount_code`). `src/lib/database.types.ts` reflects what's actually live, confirmed via direct PostgREST introspection. `order_items` has no stored per-line price — unit price is read from `products.price` at display/report time.
