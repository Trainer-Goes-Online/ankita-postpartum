'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { syncUtmWithUrl, captureFbclid } from '@/lib/utm';

/**
 * Mounted once in app/layout.tsx so it fires on every page in the app.
 * Listens to pathname changes (Next router) and on each one:
 *   - if the URL carries fresh utm_*, persists them to the cookie
 *   - if the URL has none but the cookie does, rewrites the URL via
 *     history.replaceState so the user sees UTMs in the address bar on
 *     landing → checkout → thank-you
 *
 * Renders nothing.
 */
export default function UtmCapture() {
  const pathname = usePathname();

  useEffect(() => {
    syncUtmWithUrl();
    captureFbclid();
  }, [pathname]);

  return null;
}
