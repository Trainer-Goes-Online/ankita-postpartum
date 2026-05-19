'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { readMam } from '@/lib/mam';

/* ──────────────────────────────────────────────────────────────────────
 *  <MetaPixel /> — loads the Meta Pixel base script and fires `PageView`
 *  on every page of the funnel WITH Manual Advanced Matching.
 *
 *  Loader: the inline <Script> only sets up the fbq queue function and
 *  loads fbevents.js. It does NOT call init / track — those happen in
 *  useEffect so we can read MAM from sessionStorage first.
 *
 *  Init / track: useEffect reads MAM (written by /checkout on successful
 *  conversion — see lib/mam.ts → writeMam) and passes the hashed user_data
 *  block to fbq('init', PIXEL_ID, hashedMam). All subsequent fbq events
 *  for this pixel carry that user_data — including the PageView fired
 *  immediately after.
 *
 *  On client-side route changes, useEffect re-reads MAM and re-inits the
 *  pixel only when the MAM data has changed (defends against redundant
 *  inits when MAM hasn't moved).
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
  const lastMamKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelId) return;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

    const mam = readMam();
    const mamKey = mam ? JSON.stringify(mam) : '';

    // (Re-)init the pixel whenever MAM data changes — e.g. transitioning
    // from "no MAM" (first load) → "MAM present" (after checkout success).
    if (mamKey !== lastMamKey.current) {
      lastMamKey.current = mamKey;
      if (mam) {
        window.fbq('init', pixelId, mam);
      } else {
        window.fbq('init', pixelId);
      }
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
