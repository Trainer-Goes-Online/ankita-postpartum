'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/* ──────────────────────────────────────────────────────────────────────
 *  <MetaPixel /> — loads the Meta Pixel base script and fires `PageView`
 *  on every page of the funnel:
 *   • Initial load: the inline script calls fbq('init') + fbq('track',
 *     'PageView') so the Pixel Helper Chrome extension picks up the
 *     Pixel ID immediately on first paint.
 *   • Subsequent client-side navigations (Next.js App-Router pathname
 *     changes): the effect below fires fbq('track', 'PageView') again,
 *     using the `hasInitialFired` ref to skip the duplicate first call.
 *
 *  Gated by NEXT_PUBLIC_META_PIXEL_ID — if the env var is missing,
 *  the component renders nothing and no pixel script loads.
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
  const hasInitialFired = useRef(false);

  useEffect(() => {
    if (!pixelId) return;
    if (!hasInitialFired.current) {
      // The inline base script already fires PageView on first load,
      // so skip the very first effect run to avoid a duplicate event.
      hasInitialFired.current = true;
      return;
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
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
