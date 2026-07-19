'use client';

import { useEffect } from 'react';
import { fireCheckoutIntent } from '@/lib/checkout-intent';

/**
 * Mounted once in app/layout.tsx. Listens for any anchor click whose
 * destination is `/checkout` and fires Meta AddToCart + GA4 add_to_cart
 * exactly once per browser (both dedupes handled inside fireCheckoutIntent).
 *
 * Rendering nothing. Attaching at document level lets every CTA
 * (PrimaryCTA, StickyCTA, raw Link/anchor) participate without needing to
 * become client components — hero PrimaryCTA keeps its zero-JS SSR path.
 */
export default function CheckoutIntentListener() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Match /checkout, /checkout?query, /checkout#hash, and absolute
      // URLs whose pathname is /checkout — anything else is ignored.
      const trimmed = href.split('?')[0].split('#')[0];
      const pathname = trimmed.startsWith('http')
        ? (() => {
            try {
              return new URL(trimmed).pathname;
            } catch {
              return '';
            }
          })()
        : trimmed;
      if (pathname !== '/checkout') return;

      fireCheckoutIntent();
    }

    // capture=true so we catch the click before Next.js's own Link handler
    // triggers navigation — sendBeacon is fire-and-forget so timing is
    // safe, but capture-phase gives us the widest window.
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
