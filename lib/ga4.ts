'use client';

/**
 * GA4 event helper — once per browser per event, guarded + try/catched.
 *
 * Fires `add_to_cart`, `initiate_checkout`, `join_whatsapp` at the
 * corresponding triggers. See GA4_Events_Brief_Webinar_Funnel.md v2.0.
 *
 * Rules:
 *   - No monetary parameters (no value/currency). Pure event counts.
 *   - Once per browser. localStorage flag stamped BEFORE gtag call so
 *     rapid clicks + tab-kill mid-navigation still dedupe.
 *   - If `window.gtag` is missing (base tag not loaded because the layout
 *     is host-gated to production, or user has blocked GA), we return
 *     WITHOUT stamping the flag — event stays pending, will fire on
 *     the next properly-configured session.
 *   - All failures are swallowed. Analytics never throws into a click.
 */

const STORAGE_KEYS = {
  add_to_cart:       'bw_ga4_atc_fired',
  initiate_checkout: 'bw_ga4_ic_fired',
  join_whatsapp:     'bw_ga4_wa_fired',
} as const;

type Ga4EventName = keyof typeof STORAGE_KEYS;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackGa4EventOnce(event: Ga4EventName): void {
  try {
    if (typeof window === 'undefined') return;
    // Base tag missing → GA4 disabled on this host (per host-gate). Don't
    // stamp the flag; the event stays pending for the next properly-
    // configured session.
    if (typeof window.gtag !== 'function') return;

    const key = STORAGE_KEYS[event];
    let alreadyFired = false;
    try {
      alreadyFired = window.localStorage.getItem(key) === '1';
    } catch {
      // localStorage may throw in private mode / sandboxed iframe.
      // Fall through and fire best-effort.
    }
    if (alreadyFired) return;

    // Stamp BEFORE calling gtag so a click that navigates away doesn't
    // double-fire on rapid re-clicks.
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // ignore — fire anyway
    }

    window.gtag('event', event);
  } catch {
    // Analytics must never surface an error to the user.
  }
}
