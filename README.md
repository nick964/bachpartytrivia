# Bach Party Trivia 🎉

The bachelorette (and bachelor) party game: the groom answers questions on
video before the party; at the party the bride guesses each answer out loud,
then his video plays on the TV — how well does she really know him?

## How it's put together

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript, Tailwind v4) on Vercel |
| Auth | Clerk — hosts (MOH/best man) only; groom + party use unguessable token links |
| Database | Supabase Postgres, service-role key server-side only; anon key only for read-only Realtime |
| Video | Cloudflare Stream — direct creator uploads (phone → Cloudflare), signed playback |
| Payments | Stripe Checkout, $20 one-time per event, webhook-confirmed |
| Email | Resend |

Key flows:

- `/dashboard` — Clerk-protected host dashboard: events, question editor,
  response review (watch / hide / request redo), links, downloads.
- `/respond/[token]` — the groom's phone flow: device pre-check,
  MediaRecorder capture (≤60s, H.264/MP4 preferred, WebM fallback),
  per-question direct uploads to Stream, resume anytime, submit locks in.
- `/watch/[token]` — party mode chooser; `/tv` renders slides driven by
  `playback_state` over Supabase Realtime; `/remote` is the host's phone
  remote (next / reveal / right-wrong tally).

Slide model: `current_question_index` 0 = title slide, 1..N = visible
questions, N+1 = end slide with the final right/missed tally.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in every key
npm run dev
```

**Database**: apply `schema.sql` in the Supabase SQL editor, then apply the
extensions in `MIGRATIONS.md` (tally, redo notes, email-send tracking —
required for the remote's tally and both cron emails).

**Demo data**: `node scripts/seed-demo.mjs <your_clerk_user_id>` creates a
premium demo event and prints all three links.

## Environment variables

Everything in `.env.example`. Notes:

- `SUPABASE_SERVICE_ROLE_KEY` — server-side only; never expose. The anon key
  is used client-side exclusively for Realtime reads (RLS allows read-only
  `playback_state` / `responses`).
- `CLOUDFLARE_STREAM_SIGNING_KEY_ID` / `_PEM` — from
  `POST /accounts/{id}/stream/keys`. Either the bare key id or the full
  base64 JWK blob works for the ID; the PEM can be raw or base64.
- `STRIPE_PRICE_ID_PREMIUM` — a one-time $20 Price in your Stripe account.
- `EMAIL_FROM` — a verified Resend sender, e.g.
  `Bach Party Trivia <hello@bachpartytrivia.com>`.
- `CRON_SECRET` — any long random string; Vercel sends it as
  `Authorization: Bearer` on cron invocations.

## Deploying to Vercel

1. Push the repo and import it into Vercel. Set every env var from
   `.env.example` (set `NEXT_PUBLIC_APP_URL` to the production URL).
2. **Crons** are configured in `vercel.json` (reminders daily 15:00 UTC,
   cleanup daily 08:00 UTC). Set `CRON_SECRET` so they authenticate.
3. **Stripe webhook**: add an endpoint for
   `https://your-domain/api/stripe/webhook` subscribed to
   `checkout.session.completed`, and put its signing secret in
   `STRIPE_WEBHOOK_SECRET`. Payments only flip `is_premium` via this webhook
   — the success redirect is never trusted.
4. **Clerk production instance**: create a production instance, add your
   domain, and swap `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
   to the production keys. Auth only guards `/dashboard` — `proxy.ts`
   deliberately leaves `/respond` and `/watch` outside Clerk.
5. **Cloudflare Stream**: the API token needs Stream read/write. Uploads are
   minted with `requireSignedURLs: true` and a 65s cap; playback tokens are
   short-lived and signed server-side at watch time.

## Operational notes

- Videos are deleted 30 days after the party by `/api/cron/cleanup` (with a
  warning email 7 days before). This is stated in the UI on the event page
  and the groom's intro screen.
- Free tier is 3 questions per event, enforced server-side on insert
  (`402` + `upgrade_required` → the UI shows the upgrade card).
- Video bytes never touch this app's servers — phones upload directly to
  Cloudflare Stream via one-time direct-upload URLs (Vercel's ~4.5MB body
  limit is irrelevant to recordings).
# bachpartytrivia
