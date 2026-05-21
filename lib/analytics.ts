/**
 * Client-side analytics helpers.
 * GA4 / Meta Pixel client-side init lives in app/layout.tsx (script tags).
 * Server-side Meta CAPI lives in app/api/razorpay/verify-payment/route.ts.
 *
 * Functions here are no-ops until the underlying tracking IDs are wired in layout.tsx.
 */

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
  // here. The Meta pipeline is server-side CAPI "sales" + "Purchase" only
  // (see app/api/razorpay/verify-payment/route.ts), so Meta reports cleanly
  // on one source of truth.
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
  // GA4 only. Meta's Purchase + sales signal comes from server-side CAPI
  // (verify-payment/route.ts). We deliberately do NOT fire
  // fbq('track', 'Purchase') from the browser — Meta is reporting our
  // server-side Purchase counts correctly (no inflation from auto-event
  // detection), so the browser pair is unnecessary. If duplication ever
  // becomes an issue, re-introduce a browser Purchase here with eventID =
  // paymentId so Meta dedupes the pair within 48h.
  pushDataLayer('purchase_complete', {
    transaction_id: params.paymentId,
    value: params.value,
    currency: params.currency ?? 'INR',
  });
}
