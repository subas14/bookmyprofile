# BookMyProfile

A marketplace for **creator profile advertising inventory**.

Creators monetise specific placements on their social profiles (starting with
X/Twitter). Advertisers browse available placements, review transparent audience
analytics, book a placement for a defined period, upload campaign assets, pay
online, and track campaign performance.

Launch ships with **one creator**, but every model, query and route is
**creator-scoped**, so opening the platform to more creators requires no
restructuring.

---

## What is sold

| Placement | Price | Concurrency |
| --- | --- | --- |
| Cover photo · left half (1⁄2 of cover) | $99 / month | Exclusive |
| Cover photo · right half (1⁄2 of cover) | $99 / month | Exclusive |
| Link in bio | $89 / month | Up to 3 brands, one line each |
| Launch special · link in bio | $29 / 2 weeks | Bio link only, no other discounts |
| Dedicated promo post | $249 one-off | Add-on (30% off when bundled) |

**Monthly rate by term** (term discount, rounded to a whole dollar):

| Placement | 1 mo | 3 mo (−10%) | 6 mo (−20%) | 12 mo (−30%) |
| --- | --- | --- | --- | --- |
| Cover half | $99 | $89 ($267) | $79 ($474) | $69 ($828) |
| Link in bio | $89 | $80 ($240) | $71 ($426) | $62 ($744) |

**Bundle discount** (stacked on the term discount): 2 placements −5%, 3 −10%.

The launch special is stored as `months = 0` and runs for a fixed 14 days
(see `LAUNCH_SPECIAL` in `src/lib/pricing.ts`; set `active: false` to retire it).

---

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**
- **Prisma 6**: SQLite for local dev, Postgres-ready for production
- **Dodo Payments**: hosted checkout (card / wallet / crypto), merchant of record
- **Zod**: request validation on every mutating route
- **standardwebhooks**: HMAC SHA256 webhook signature verification

---

## Quick start

```bash
npm install
cp .env.example .env     # then fill in the values you need
npm run setup            # prisma generate + db push + seed
npm run dev              # http://localhost:3000
```

`npm run setup` creates `prisma/dev.db` and seeds the launch creator, the six
placements, two analytics snapshots (30-day and 90-day), audience composition
and testimonials.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Database connection. `file:./dev.db` for local SQLite. |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL; used to build checkout return URLs. |
| `DODO_PAYMENTS_API_KEY` | for payments | Dodo API key (Developer → API Keys). |
| `DODO_PAYMENTS_ENVIRONMENT` | for payments | `test_mode` or `live_mode`. |
| `DODO_PAYMENTS_PRODUCT_ID` | for payments | A one-time **pay-what-you-want** product. |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | for payments | Endpoint signing secret. |
| `ADMIN_TOKEN` | for admin | Grants access to `/admin`. `openssl rand -hex 32`. |
| `NEXT_PUBLIC_PRIMARY_CREATOR_SLUG` | no | Creator featured on the marketing site. |

The app degrades gracefully: without Dodo credentials, bookings are still
recorded and the advertiser is told a payment link will follow, rather than being
shown a broken checkout.

---

## Routes

**Public** — `/` landing · `/analytics` full audience data · `/pricing` rate card
· `/book` booking flow · `/faq` · `/transparency` · `/terms` · `/privacy`

**Transactional** — `/checkout/return` post-payment · `/campaigns` advertiser
campaign tracking (reference + email)

**Creator** — `/admin` review queue, revenue and moderation actions

**API** — `POST /api/quote` · `GET /api/availability` · `POST /api/bookings` ·
`POST /api/webhooks/dodo` · `POST /api/campaigns/lookup` ·
`POST|DELETE /api/admin/session` · `POST /api/admin/bookings` · `GET /api/health`

---

## Architecture notes

**Money is always integer cents.** No floating-point arithmetic touches a price.
Discounts are expressed in basis points and rounded once, at the end.

**Pricing is server-authoritative.** The client posts a *selection*, never an
amount. `/api/quote` returns the authoritative breakdown, so the total on screen
is always the total charged.

**Inventory is only consumed by paid bookings.** A booking starts as
`PENDING_PAYMENT` and does not block its slot. The Dodo webhook moves it to
`AWAITING_REVIEW`, at which point it becomes exclusive. Abandoned checkouts
therefore never sit on inventory.

**Booking lifecycle.**

```
PENDING_PAYMENT ──payment──> AWAITING_REVIEW ──approve──> SCHEDULED ──> LIVE ──> COMPLETED
       │                            │                         │          │
       └── CANCELLED                └── REJECTED              └── CANCELLED
```

Transitions are whitelisted server-side; an illegal jump is refused even if
requested directly against the API.

**Overlap semantics.** Terms are inclusive-start / exclusive-end, so a term
ending 1 April and one starting 1 April do **not** overlap. Month arithmetic
clamps to month end (31 Jan + 1 month → 28/29 Feb), and all boundaries are
normalised to UTC midnight so terms never shift with server locale.

**Multi-placement orders.** An order creates one `Booking` row per placement,
sharing a single `reference`. Inventory stays modelled per placement while the
advertiser sees one campaign and one payment. Discounts are attributed to the
first row so row totals sum exactly to the amount charged. Uniqueness is scoped
to `(reference, placementId)` — `reference` is deliberately not globally unique.

**Webhooks are idempotent.** Dodo retries deliveries; the `paymentSettledAt`
marker means a replay settles nothing. Signature failures return 400 so Dodo
retries, handler failures return 500, and unhandled event types are acknowledged
so they are not retried forever.

**Auth.** With a single creator, a constant-time-compared bearer token in an
HttpOnly cookie is sufficient and avoids shipping a half-built user system.
`src/server/auth.ts` is the single place to swap in real identity later.

---

## Testing

```bash
npm test               # pricing + dates + lifecycle
npm run test:pricing   # 20 assertions on the rate card and discount stacking
npm run test:dates     # month-end clamping, leap years, overlap, UTC safety
npm run test:lifecycle # booking → payment → review → live, against the real DB
npm run typecheck
npm run lint
```

The lifecycle suite exercises the rules that protect revenue: unpaid bookings do
not reserve inventory, replayed webhooks are no-ops, overlapping bookings are
rejected, back-to-back terms are allowed, illegal transitions are refused, and
bundle row totals reconcile to the charged amount. It cleans up after itself.

> These suites caught a real bug during development: `reference` was originally
> `@unique`, which broke multi-placement orders. The constraint is now correctly
> scoped to `(reference, placementId)`.

---

## Deploying to Postgres

1. In `prisma/schema.prisma`, set `provider = "postgresql"`.
2. Point `DATABASE_URL` at your instance.
3. `npx prisma migrate deploy && npx prisma db seed`

The schema avoids SQLite-only features and stores status/kind fields as strings
(constrained by union types in `src/lib/domain.ts`), so it compiles unchanged on
both providers.

## Configuring Dodo Payments

1. Create a **one-time, pay-what-you-want** product; put its ID in
   `DODO_PAYMENTS_PRODUCT_ID` so per-booking amounts can be passed.
2. Add a webhook endpoint at `https://your-domain/api/webhooks/dodo`, subscribed
   to `payment.succeeded`, `payment.failed` and `payment.cancelled`.
3. Copy the signing secret into `DODO_PAYMENTS_WEBHOOK_SECRET`.
4. Switch `DODO_PAYMENTS_ENVIRONMENT` to `live_mode` for production.

---

## Updating the published analytics

Analytics are data, not hard-coded copy. Edit the `SNAPSHOTS` array in
`prisma/seed.ts` and re-run `npm run db:seed`, or update the `AnalyticsSnapshot`
rows directly. Set `proofUrl` to a public screenshot so every figure on
`/analytics` is independently verifiable.

Current seeded figures: **7M impressions / 30 days**, **22M / 90 days**.
