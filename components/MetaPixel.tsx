'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { readMam } from '@/lib/mam';
import { getOrCreateExternalId } from '@/lib/external-id';

/* ──────────────────────────────────────────────────────────────────────
 *  <MetaPixel /> — loads the Meta Pixel base script and fires `PageView`
 *  on every page of the funnel with Manual Advanced Matching + external_id.
 *
 *  Loader: the inline <Script> only sets up the fbq queue function and
 *  loads fbevents.js. It does NOT call init / track — those happen in
 *  useEffect so we can read MAM + external_id from cookies first.
 *
 *  Identity payload passed to fbq('init', PIXEL_ID, matching):
 *    - external_id: raw UUID from bw_uid cookie (Meta hashes client-side).
 *      Present on EVERY PageView from the user's very first visit — cookie
 *      is created on demand by getOrCreateExternalId().
 *    - em, ph, fn, ln, ct, country: hashed values read from bw_mam cookie
 *      (written by /checkout's form-fill effect + post-conversion handlers).
 *      Present once the user has filled the checkout form OR converted;
 *      persists 30 days so returning visitors carry MAM on landing.
 *
 *  On client-side route changes, useEffect re-reads both cookies and
 *  re-inits the pixel only when the matching object has changed.
 *
 *  Gated by NEXT_PUBLIC_META_PIXEL_ID — if the env var is missing the
 *  component renders nothing and no pixel script loads.
 * ─────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const pathname = usePathname();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelId) return;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

    // Always present (creates on first visit, otherwise reads cookie).
    const externalId = getOrCreateExternalId();
    // Present once the user has filled the checkout form or converted —
    // returning visitors carry this on every PageView for 30 days.
    const mam = readMam();

    const matching: Record<string, string> = { external_id: externalId };
    if (mam) Object.assign(matching, mam);

    // Re-init only when the matching block actually changes. Calling init
    // with identical options is harmless but we keep it tight.
    const key = JSON.stringify(matching);
    if (key !== lastKey.current) {
      lastKey.current = key;
      window.fbq('init', pixelId, matching);
    }

    window.fbq('track', 'PageView');
  }, [pathname, pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel-loader" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
