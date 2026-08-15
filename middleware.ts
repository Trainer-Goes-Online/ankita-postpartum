import { NextResponse, type NextRequest } from 'next/server';
import {
  ATTR_COOKIE,
  ATTR_TTL_SECONDS,
  mergeAttribution,
  parseAttributionFromUrl,
  readAttrCookie,
} from '@/lib/attribution';

/**
 * L1 — Edge attribution capture.
 *
 * Runs on every HTML request before any React code hydrates. Reads the
 * URL's `utm_*` / `fbclid` / `gclid` params, merges with the existing
 * `bw_attr` cookie (last-touch for attribution, first-touch for
 * landing_url + referrer), writes the cookie back. That's it.
 *
 * Why this exists: capture that lives only in a client `useEffect` can
 * lose the hydration race on in-app browsers with heavy landing pages.
 * A user who taps the CTA the instant paint completes will navigate
 * away before capture runs, and the CRM row has blank UTMs. Middleware
 * runs on the SERVER on the first request, so the cookie is set before
 * any tap can win.
 *
 * The client-side `<UtmCapture>` component stays as-is — its
 * `bodyworx_utm` + `bw_fbclid` cookies still get read as a body
 * supplement, but `bw_attr` (this cookie) is the primary source.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const live = parseAttributionFromUrl(req.nextUrl.search);
    const stored = readAttrCookie(req.cookies.get(ATTR_COOKIE)?.value);
    const { attr, changed } = mergeAttribution(stored, {
      live,
      landingUrl: req.nextUrl.href,
      referrer: req.headers.get('referer') ?? '',
      now: Date.now(),
    });
    if (changed) {
      res.cookies.set(ATTR_COOKIE, encodeURIComponent(JSON.stringify(attr)), {
        path: '/',
        maxAge: ATTR_TTL_SECONDS,
        sameSite: 'lax',
        // false so the client `<UtmCapture>` can still read it if it
        // ever needs to (mirroring — not required today).
        httpOnly: false,
        secure: req.nextUrl.protocol === 'https:',
      });
    }
  } catch {
    /* attribution is best-effort — never break a page render */
  }
  return res;
}

/**
 * Match every HTML page but skip everything Next.js serves as an asset
 * or an API. The final `.*\\..*` clause excludes any path with a dot
 * (favicons, icons, sitemap.xml, etc.) so we don't run a JSON cookie
 * write on binary/asset requests.
 */
export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
