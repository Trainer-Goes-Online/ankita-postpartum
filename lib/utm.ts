import { CHECKOUT_CONFIG } from './checkout-config';

/**
 * UTM persistence for paid traffic (Meta/Instagram ads). Stored in a
 * first-party cookie so the values survive:
 *   1. Client navigation (Next.js drops query params on internal Link clicks)
 *   2. New tabs (user opens checkout in a fresh tab)
 *   3. Returning visits within the campaign attribution window (30 days)
 *
 * The cookie is read on every page mount by <UtmCapture/>, which also
 * rewrites the current URL via history.replaceState so the address bar
 * shows ?utm_* on every page (helpful for analytics + debugging).
 */

export type UtmData = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
};

const UTM_KEYS = [
  'source',
  'medium',
  'campaign',
  'content',
  'term',
  'id',
] as const;

const COOKIE_NAME = CHECKOUT_CONFIG.utmSessionKey; // 'bodyworx_utm'
const COOKIE_TTL_DAYS = 30;

function hasAnyUtm(utm: UtmData): boolean {
  return UTM_KEYS.some((k) => Boolean(utm[k]));
}

export function readUtmFromUrl(search: string): UtmData {
  const sp = new URLSearchParams(search);
  return {
    source: sp.get('utm_source') ?? undefined,
    medium: sp.get('utm_medium') ?? undefined,
    campaign: sp.get('utm_campaign') ?? undefined,
    content: sp.get('utm_content') ?? undefined,
    term: sp.get('utm_term') ?? undefined,
    id: sp.get('utm_id') ?? undefined,
  };
}

export function writeUtmCookie(
  utm: UtmData,
  ttlDays: number = COOKIE_TTL_DAYS
): void {
  if (typeof document === 'undefined') return;
  if (!hasAnyUtm(utm)) return;

  const value = encodeURIComponent(JSON.stringify(utm));
  const maxAge = ttlDays * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function readUtmCookie(): UtmData {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`)
  );
  if (!match) return {};
  try {
    return JSON.parse(decodeURIComponent(match[1])) as UtmData;
  } catch {
    return {};
  }
}

/**
 * Append stored UTMs (from cookie) onto a URL. Existing utm_* params on the
 * URL win over the cookie values — so if a fresh utm_source arrives in the
 * URL it overrides what was cached.
 */
export function withUtm(path: string): string {
  if (typeof document === 'undefined') return path;
  const utm = readUtmCookie();
  if (!hasAnyUtm(utm)) return path;

  const hashIdx = path.indexOf('#');
  const hash = hashIdx >= 0 ? path.slice(hashIdx) : '';
  const pathNoHash = hashIdx >= 0 ? path.slice(0, hashIdx) : path;

  const queryIdx = pathNoHash.indexOf('?');
  const base = queryIdx >= 0 ? pathNoHash.slice(0, queryIdx) : pathNoHash;
  const existing = new URLSearchParams(
    queryIdx >= 0 ? pathNoHash.slice(queryIdx + 1) : ''
  );

  UTM_KEYS.forEach((k) => {
    const paramKey = `utm_${k}`;
    const v = utm[k];
    if (!existing.has(paramKey) && v) {
      existing.set(paramKey, v);
    }
  });

  const queryString = existing.toString();
  return base + (queryString ? `?${queryString}` : '') + hash;
}

/**
 * For pages where you want UTMs visible in the address bar (e.g. landing,
 * checkout, thank-you). Reads current URL → if it has UTMs, persists them
 * to the cookie. If URL has no UTMs but cookie does, rewrites the URL via
 * history.replaceState so the address bar reflects the campaign attribution.
 */
export function syncUtmWithUrl(): void {
  if (typeof window === 'undefined') return;

  const urlUtm = readUtmFromUrl(window.location.search);

  // Case 1: URL carries UTMs — cache them, leave URL alone.
  if (hasAnyUtm(urlUtm)) {
    writeUtmCookie(urlUtm);
    return;
  }

  // Case 2: URL has none — restore from cookie if present, rewrite URL.
  const cookieUtm = readUtmCookie();
  if (!hasAnyUtm(cookieUtm)) return;

  const sp = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach((k) => {
    const paramKey = `utm_${k}`;
    const v = cookieUtm[k];
    if (v && !sp.has(paramKey)) sp.set(paramKey, v);
  });

  const newSearch = sp.toString();
  const newUrl =
    window.location.pathname +
    (newSearch ? `?${newSearch}` : '') +
    window.location.hash;

  window.history.replaceState(window.history.state, '', newUrl);
}
