/**
 * Client-side analytics helpers.
 * GA4 / Meta Pixel client-side init lives in app/layout.tsx (script tags).
 * Server-side Meta CAPI lives in app/api/razorpay/verify-payment/route.ts.
 *
 * Functions here are no-ops until the underlying tracking IDs are wired in layout.tsx.
 */

import { readMam } from './mam';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

function pushDataLayer(event: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}

export function trackBeginCheckout(value: number, currency = 'INR') {
  // GA4 only — we deliberately don't fire Meta's standard `InitiateCheckout`
  // here. The Meta pipeline is server-side CAPI "sales" only (see
  // app/api/razorpay/verify-payment/route.ts), so Meta reports cleanly on
  // the one custom event instead of mixing standard + custom signals.
  pushDataLayer('begin_checkout', { value, currency });
}

export function trackCtaClick(ctaLabel: string, location: string) {
  pushDataLayer('cta_click', { cta_label: ctaLabel, location });
}

export function trackPurchaseComplete(params: {
  paymentId: string;
  value: number;
  currency?: string;
}) {
  // GA4 dataLayer push.
  pushDataLayer('purchase_complete', {
    transaction_id: params.paymentId,
    value: params.value,
    currency: params.currency ?? 'INR',
  });
}

/**
 * Fire the Meta Pixel standard 'Purchase' event from the browser, paired
 * with the server CAPI Purchase event of the same event_id for Meta's
 * dedup window (48h).
 *
 * Why we fire from BOTH sides (browser + server):
 *  - Server CAPI is the authoritative source (not blocked by ad blockers /
 *    iOS tracking prevention) — guarantees we count every paid conversion.
 *  - Browser pixel pairs with CAPI so Meta dedupes by event_id. Without a
 *    browser pair, Meta's dedup coverage drops to 0% AND Meta's Automatic
 *    Event Detection synthesises uncontrolled browser Purchase events from
 *    page metadata — those have no eventID, can't dedupe, and inflate the
 *    reported count (e.g. 16 real sales → 49 reported Purchases on the
 *    sibling prenatal pixel before this fix).
 *
 * Per Meta dedup spec
 * (https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events):
 *   "Browser eventID must equal server event_id, and event_name must match
 *   exactly. Both events must arrive within a 48-hour window."
 *
 * MAM handling: this funnel stashes hashed identifiers in sessionStorage
 * via writeMam() and applies them via fbq('init', PIXEL_ID, mam) on the
 * /thank-you mount. But the Purchase event fires BEFORE that route change,
 * so we also re-init the pixel here with whatever MAM was just written —
 * gives the browser Purchase the same 9+/10 EMQ as the server CAPI event.
 *
 * Call this AFTER writeMam() and BEFORE router.push.
 *
 * IMPORTANT: only call from the paid success path. The free-coupon path
 * must NOT fire this — server skips CAPI for free orders, so a browser
 * Purchase with no server pair would count as a real ₹0 Purchase.
 */
export function trackPurchasePixel(params: {
  paymentId: string;        // used as eventID — must equal server event_id
  value: number;            // rupees (major units), same value as CAPI
  currency?: string;        // ISO 4217, e.g. 'INR'
  contentName?: string;     // display label in Events Manager
}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return;
  // Re-init the pixel with MAM (already stashed by writeMam) so the
  // Purchase event below inherits the hashed identity. MetaPixel.tsx
  // does the same on route change for PageView; we do it inline here
  // so Purchase fires WITH MAM on the current page before navigation.
  const mam = readMam();
  if (mam) window.fbq('init', pixelId, mam);
  window.fbq(
    'track',
    'Purchase',
    {
      value: params.value,
      currency: params.currency ?? 'INR',
      content_name: params.contentName ?? '5-Day Postpartum Recovery Challenge',
    },
    { eventID: params.paymentId },
  );
}
