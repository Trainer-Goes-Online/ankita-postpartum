'use client';

import { trackGa4EventOnce } from '@/lib/ga4';

/**
 * Called from every landing-page CTA that routes to /checkout.
 * Fires two intent events, both deduped ONCE per browser:
 *   - Meta CAPI `AddToCart` via server route /api/meta/add-to-cart
 *     (localStorage: bw_atc_fired)
 *   - GA4 `add_to_cart` via gtag (localStorage: bw_ga4_atc_fired, handled
 *     inside trackGa4EventOnce)
 *
 * Fire-and-forget — never blocks the anchor navigation.
 */

const META_ATC_KEY = 'bw_atc_fired';

export function fireCheckoutIntent(): void {
  // GA4 side (uses its own bw_ga4_atc_fired flag; internal helper handles
  // guard + try/catch).
  trackGa4EventOnce('add_to_cart');

  // Meta CAPI side.
  if (typeof window === 'undefined') return;
  let alreadyFired = false;
  try {
    alreadyFired = window.localStorage.getItem(META_ATC_KEY) === '1';
  } catch {
    // localStorage may throw in private mode — fall through and fire best-effort.
  }
  if (alreadyFired) return;

  // Stamp BEFORE the beacon so rapid double-clicks or a tab-kill mid-nav
  // still leaves the flag set — prevents double fires.
  try {
    window.localStorage.setItem(META_ATC_KEY, '1');
  } catch {
    // ignore — fire anyway
  }

  const body = JSON.stringify({ eventSourceUrl: window.location.href });

  try {
    // sendBeacon survives page navigation (unlike a plain fetch) — perfect
    // for CTA clicks that immediately route to /checkout.
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/meta/add-to-cart', blob);
      if (ok) return;
    }
    // Fallback for older browsers or if sendBeacon returns false.
    void fetch('/api/meta/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* swallow */ });
  } catch {
    // Absolutely must never block the CTA click.
  }
}
