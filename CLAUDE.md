# BodyWorx — 5-Day Postpartum Recovery Challenge

Production domain: **bodyworx.in**. Next.js 14 App-Router single-funnel site selling Dr. Ankita's ₹497 postpartum recovery challenge. Sibling project to the prenatal funnel — same Razorpay merchant, **different Meta Pixel**.

## Stack

- **Framework:** Next.js 14.2 (App Router) · React 18 · TypeScript 5
- **Styling:** Tailwind 3 + Framer Motion + Phosphor Icons + custom fonts (Plus Jakarta, Poppins, Fraunces)
- **Payments:** Razorpay (live keys) — official `razorpay` Node SDK + browser checkout modal
- **CRM:** Pabbly Connect webhook (fired server-side after payment verify)
- **Tracking:** Meta Pixel (client `PageView` only, with Manual Advanced Matching — hashed identifiers passed to `fbq('init', PIXEL_ID, mam)` post-conversion) + Meta CAPI (server dual-event `Purchase` + `sales` in one POST, full EMQ payload with 6 hashed PII fields + raw `fbc`/`fbp`/IP/UA + `event_source_url`) · GA4 + Clarity wired via env vars
- **Deploy:** Vercel → `bodyworx.in`

## Architecture

```
app/
  layout.tsx                       — Root metadata (metadataBase = https://bodyworx.in), fonts, footer, MetaPixel + UtmCapture mount, GA4/Clarity script slots
  page.tsx                         — Single-file landing page (21 numbered sections, ~1900 LOC)
  globals.css                      — Tailwind base + brand utility classes
  checkout/page.tsx                — 2-col Razorpay checkout (form + order summary)
  thank-you/page.tsx               — Confirmation + WhatsApp invite
  privacy-policy/page.tsx          — Legal
  terms-and-conditions/page.tsx    — Legal
  refund-policy/page.tsx           — 7-day money-back guarantee
  api/razorpay/create-order/route.ts   — POST: creates Razorpay order (or signed free-order token for 100%-off coupon)
  api/razorpay/verify-payment/route.ts — POST: HMAC-verifies, fetches paid amount, fires Pabbly + Meta CAPI

components/
  MetaPixel.tsx        — Loads fbevents.js + fires PageView on route changes with Manual Advanced Matching (reads hashed user_data from sessionStorage via lib/mam.ts). No-op if NEXT_PUBLIC_META_PIXEL_ID unset
  UtmCapture.tsx       — Persists utm_* to bodyworx_utm cookie on every page mount
  StickyCTA.tsx        — Bottom-fixed "Enroll Now" bar
  PaymentLogos.tsx     — UPI / cards / netbanking trust row
  VideoLightbox.tsx    — Testimonial video player
  CountUp.tsx          — Animated stat counter
  Icon3D.tsx           — Gradient 3D-style icon wrapper
  LegalPageLayout.tsx  — Shared shell for /privacy /terms /refund

lib/
  checkout-config.ts   — SINGLE source of truth for price/currency/CAPI hosts. Reads NEXT_PUBLIC_OFFER_PRICE_RUPEES
  coupons.ts           — Server-authoritative coupon validation (only `tgotest2025` = 100% off)
  utm.ts               — UTM cookie read/write + URL sync helpers
  analytics.ts         — dataLayer push helpers (GA4 only — Meta uses CAPI server-side)
  mam.ts               — Manual Advanced Matching: SHA-256 hashing helpers (SubtleCrypto) + sessionStorage read/write. Same normalization rules as server CAPI so hashes match across both sources
  testimonials.ts      — Testimonial data array

public/
  team/                — Founder/team imagery
  testimonials/        — Client testimonial videos & posters
  transformations/     — Before/after marquee tiles
```

## Routes (jump-table)

| Route | File | Notes |
|---|---|---|
| `/` | [app/page.tsx](app/page.tsx) | Landing — 21 sections, see `// ── N. <name>` markers |
| `/checkout` | [app/checkout/page.tsx](app/checkout/page.tsx) | `handleSubmit` line ~370, `handlePaymentSuccess` line ~488 |
| `/thank-you` | [app/thank-you/page.tsx](app/thank-you/page.tsx) | `WHATSAPP_INVITE` line ~70 |
| `/privacy-policy` | [app/privacy-policy/page.tsx](app/privacy-policy/page.tsx) | |
| `/terms-and-conditions` | [app/terms-and-conditions/page.tsx](app/terms-and-conditions/page.tsx) | |
| `/refund-policy` | [app/refund-policy/page.tsx](app/refund-policy/page.tsx) | |
| `POST /api/razorpay/create-order` | [app/api/razorpay/create-order/route.ts](app/api/razorpay/create-order/route.ts) | Creates order or free-order token |
| `POST /api/razorpay/verify-payment` | [app/api/razorpay/verify-payment/route.ts](app/api/razorpay/verify-payment/route.ts) | HMAC verify → Pabbly → CAPI |

## Key code locations

- **Price control:** [lib/checkout-config.ts:16](lib/checkout-config.ts#L16) — reads `NEXT_PUBLIC_OFFER_PRICE_RUPEES` (default 497)
- **Razorpay init (server):** [app/api/razorpay/create-order/route.ts:9-14](app/api/razorpay/create-order/route.ts#L9-L14)
- **Free-order HMAC sign:** [app/api/razorpay/create-order/route.ts:23-28](app/api/razorpay/create-order/route.ts#L23-L28)
- **Payment signature verify:** [app/api/razorpay/verify-payment/route.ts:224-234](app/api/razorpay/verify-payment/route.ts#L224-L234)
- **Authoritative paid-amount fetch:** [app/api/razorpay/verify-payment/route.ts:114-139](app/api/razorpay/verify-payment/route.ts#L114-L139)
- **Pabbly payload build + POST:** [app/api/razorpay/verify-payment/route.ts:249-295](app/api/razorpay/verify-payment/route.ts#L249-L295)
- **Meta CAPI dual-event sender:** [app/api/razorpay/verify-payment/route.ts](app/api/razorpay/verify-payment/route.ts) — `sendMetaCapiEvents()` fires `Purchase` + `sales` in one POST. Gated by (a) production host, (b) `!isFreeOrder`, (c) both env vars set
- **Hash + normalization helpers:** `hashEmail` / `hashPhone` / `hashName` / `hashCity` / `hashCountry` at top of verify-payment route — follow Meta's spec exactly
- **Production host allowlist + CAPI event names + fallback URL:** [lib/checkout-config.ts](lib/checkout-config.ts) under the `capi:` block — `standardEventName`, `customEventName`, `productionHosts`, `fallbackEventSourceUrl`
- **Client `eventSourceUrl` plumbing:** [app/checkout/page.tsx](app/checkout/page.tsx) — both `handlePaymentSuccess` and `handleFreeOrderSuccess` send `window.location.href` in the verify-payment POST body
- **Manual Advanced Matching:** [lib/mam.ts](lib/mam.ts) (hash + storage), [components/MetaPixel.tsx](components/MetaPixel.tsx) (read + `fbq('init', PIXEL_ID, mam)`), [app/checkout/page.tsx](app/checkout/page.tsx) calls `writeMam()` in both success handlers before `router.push`
- **Client Razorpay modal:** [app/checkout/page.tsx:421-443](app/checkout/page.tsx#L421-L443)
- **Metadata + metadataBase:** [app/layout.tsx:43-58](app/layout.tsx#L43-L58)
- **GA4 / Clarity IDs (currently empty):** [app/layout.tsx:38-39](app/layout.tsx#L38-L39)

## Brand guidelines

| Token | Value | Use |
|---|---|---|
| `brand` | `#F24C69` | Primary CTA / accents |
| `brand-bright` | `#F87186` | Hover / glow |
| `brand-deep` | `#944453` | Gradient base / serious copy |
| `brand-soft` | `#FCE7EC` | Pill backgrounds |
| `brand-rose` | `#FFE8EE` | Section tints |
| `brand-cream` | `#FFF7F8` | Page wash |
| `ink` | `#1A0E12` | Body text |
| `ink-soft` / `ink-muted` | `#4A3B40` / `#8A7A7E` | Secondary text |
| `line` | `#F1E4E8` | Dividers |

- **Gradient:** `bg-brand-gradient` = `#F24C69 → #944453` (vertical) · `bg-brand-gradient-x` horizontal variant
- **Fonts:** `font-heading` (Plus Jakarta Sans) · `font-body` (Poppins) · `font-editorial` (Fraunces — display only)
- **Theme color:** `#F24C69` (viewport meta + Razorpay modal)
- Full Tailwind tokens: [tailwind.config.ts](tailwind.config.ts)

## Client / offer context

- **Founder:** Dr. Ankita — physiotherapist · "Dr. Ankita Postpartum Recovery Method™"
- **Offer:** 5-Day Postpartum Recovery Challenge — heal diastasis recti, restore core + pelvic floor
- **Price:** ₹497 (list ₹1,660) · 7-day money-back guarantee
- **Class timings:** 7 AM · 4 PM · 7 PM IST · Start date `21st May` — hardcoded in [app/page.tsx](app/page.tsx)
- **WhatsApp community:** invite hardcoded at [app/thank-you/page.tsx:70](app/thank-you/page.tsx#L70)
- **Support email:** `hello@bodyworx.in` (referenced in legal pages)

## Env vars

Copy [.env.local.example](.env.local.example) → `.env.local`. Required for live functionality:

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — server-only (live keys, shared with prenatal merchant)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same key ID, exposed to client
- `PABBLY_WEBHOOK_URL` — CRM webhook (already populated in example)
- `NEXT_PUBLIC_META_PIXEL_ID` — **postpartum-specific pixel** (must differ from prenatal)
- `META_CAPI_ACCESS_TOKEN` — server-only CAPI token
- `NEXT_PUBLIC_OFFER_PRICE_RUPEES` / `NEXT_PUBLIC_OFFER_LIST_PRICE_RUPEES` — price toggles

GA4 + Clarity IDs are literals in [app/layout.tsx](app/layout.tsx) (not env vars).

## Payment flow (one screen)

1. `/checkout` form submit → POST `/api/razorpay/create-order` with optional `couponCode`
2. Server validates coupon, creates Razorpay order (or signs a free-order token if 100% off)
3. Client opens Razorpay modal; on success → POST `/api/razorpay/verify-payment` with `{orderId, paymentId, signature, customer, utm, couponCode?}`
4. Server HMAC-verifies signature, fetches true paid amount from Razorpay
5. Server fires Pabbly webhook (always) and Meta CAPI dual-event `Purchase` + `sales` (production hosts only, paid orders only — free QA-coupon orders skip CAPI)
6. Client routes to `/thank-you?amount=…&currency=INR`

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run type-check   # tsc --noEmit
npm run lint
```
