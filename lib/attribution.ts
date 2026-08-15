/**
 * Attribution — pure, Edge-safe module (no node:crypto, no DOM).
 *
 * The mission: capture utm_* / fbclid / gclid at the edge on the FIRST
 * request (middleware.ts), so attribution survives even when the user's
 * browser abandons before React hydrates. Client-side capture in a
 * useEffect can lose the hydration race on in-app browsers with heavy
 * landing pages — and the misses are biased toward paid social traffic
 * (exactly what we're trying to attribute).
 *
 * This module is imported by BOTH middleware.ts (Edge runtime — Node
 * built-ins forbidden) and Node API routes. Keep it dependency-free.
 *
 * Precedence when resolving per-field:
 *   URL  →  cookie  →  body  →  referrer  →  _fbc  →  none
 * `referrer` is deliberately skipped for `fbclid` (Razorpay's 256-char
 * note limit truncated a real fbclid from 195 → 49 chars in the field
 * that inspired this module — never trust rf for fbclid). `_fbc` is
 * the only complete off-URL source of fbclid.
 */

export const ATTR_COOKIE = 'bw_attr';
export const ATTR_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const URL_TO_KEY: Record<string, string> = {
  utm_source: 'source',
  utm_medium: 'medium',
  utm_campaign: 'campaign',
  utm_content: 'content',
  utm_term: 'term',
  utm_id: 'id',
  fbclid: 'fbclid',
  gclid: 'gclid',
};
export const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term', 'id'] as const;

export type AttrLike = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
  fbclid?: string;
  gclid?: string;
  ts?: number;
  landing_url?: string;
  referrer?: string;
};

const isFilled = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/** Parse utm_ / fbclid / gclid params off a URL or search string. Returns only filled values. */
export function parseAttributionFromUrl(input: string | undefined | null): AttrLike {
  const out: AttrLike = {};
  if (!input) return out;
  try {
    const search = input.includes('?') ? input.slice(input.indexOf('?')) : input;
    const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    for (const [param, key] of Object.entries(URL_TO_KEY)) {
      const v = sp.get(param);
      if (isFilled(v)) (out as Record<string, string>)[key] = v;
    }
  } catch {
    /* malformed — ignore */
  }
  return out;
}

/**
 * `_fbc` cookie format: `fb.<subdomainIndex>.<clickTsMs>.<fbclid>`.
 * This is the ONLY complete off-URL source of a full-length fbclid —
 * never derive fbclid from `referrer` (Razorpay 256-char note limit
 * truncates it silently).
 */
export function parseFbc(fbc: string | undefined | null): { fbclid?: string; ts?: number } {
  if (!isFilled(fbc)) return {};
  const parts = fbc.split('.');
  if (parts.length < 4 || parts[0] !== 'fb') return {};
  const ts = Number(parts[2]);
  return {
    fbclid: parts.slice(3).join('.'),
    ts: Number.isFinite(ts) && ts > 0 ? ts : undefined,
  };
}

export function readAttrCookie(raw: string | undefined | null): AttrLike {
  if (!isFilled(raw)) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Merge in the middleware. ATTRIBUTION (utm/fbclid/gclid/ts) is
 * LAST-TOUCH — a fresh tagged URL overwrites. CONTEXT (landing_url +
 * referrer) is FIRST-TOUCH — set once so re-navigations within the
 * site don't reset the landing page or wipe the referrer.
 */
export function mergeAttribution(
  stored: AttrLike,
  liveContext: {
    live: AttrLike;
    landingUrl: string;
    referrer: string;
    now: number;
  },
): { attr: AttrLike; changed: boolean } {
  const attr: AttrLike = { ...stored };
  let changed = false;

  if (!isFilled(attr.landing_url) && isFilled(liveContext.landingUrl)) {
    attr.landing_url = liveContext.landingUrl;
    attr.referrer = isFilled(liveContext.referrer) ? liveContext.referrer : '';
    changed = true;
  }
  if (liveContext.live && Object.keys(liveContext.live).length > 0) {
    Object.assign(attr, liveContext.live, { ts: liveContext.now });
    changed = true;
  }
  return { attr, changed };
}

export type ResolvedAttribution = {
  utm: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
    term: string;
    id: string;
  };
  fbclid: string;
  fbclidTs: number;
  gclid: string;
  referrer: string;
  landingUrl: string;
  provenance: string; // e.g. "utm:cookie|clid:fbc"
  utmSource: 'cookie' | 'body' | 'referrer' | 'none';
  clidSource: 'cookie' | 'body' | 'fbc' | 'none';
};

/**
 * Per-field resolve applying the precedence chain. Called by every
 * server route + the webhook (defense-in-depth: repairs pre-existing
 * orders if create-order ever regressed).
 */
export function resolveAttribution(input: {
  cookieAttr?: AttrLike;
  bodyAttr?: AttrLike;
  referrer?: string;
  landingUrl?: string;
  fbc?: string;
  now?: number;
} = {}): ResolvedAttribution {
  const cookieAttr = input.cookieAttr ?? {};
  const bodyAttr = input.bodyAttr ?? {};
  const referrer = input.referrer ?? '';
  const landingUrl = input.landingUrl ?? '';
  const fbc = input.fbc ?? '';
  const now = input.now ?? Date.now();

  const utm = {
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: '',
    id: '',
  };
  let utmSource: ResolvedAttribution['utmSource'] = 'none';

  for (const [label, src] of [
    ['cookie', cookieAttr],
    ['body', bodyAttr],
  ] as const) {
    for (const key of UTM_KEYS) {
      const cur = utm[key];
      const val = (src as Record<string, string | undefined>)?.[key];
      if (!isFilled(cur) && isFilled(val)) {
        utm[key] = val;
        if (utmSource === 'none') utmSource = label;
      }
    }
  }

  // L3 — utm_* recovered from referrer / landing URL when everything
  // above came back blank. Never for fbclid (see parseFbc note).
  if (UTM_KEYS.every((k) => !isFilled(utm[k]))) {
    const recovered = {
      ...parseAttributionFromUrl(landingUrl),
      ...parseAttributionFromUrl(referrer),
    };
    let used = false;
    for (const key of UTM_KEYS) {
      const v = (recovered as Record<string, string | undefined>)[key];
      if (isFilled(v)) {
        utm[key] = v;
        used = true;
      }
    }
    if (used) utmSource = 'referrer';
  }

  // fbclid — cookie → body → derive from _fbc. Referrer excluded.
  let fbclid = '';
  let fbclidTs = 0;
  let clidSource: ResolvedAttribution['clidSource'] = 'none';
  if (isFilled(cookieAttr.fbclid)) {
    fbclid = cookieAttr.fbclid;
    clidSource = 'cookie';
    fbclidTs = Number(cookieAttr.ts) || 0;
  } else if (isFilled(bodyAttr.fbclid)) {
    fbclid = bodyAttr.fbclid;
    clidSource = 'body';
    fbclidTs = Number(bodyAttr.ts) || 0;
  } else {
    const f = parseFbc(fbc);
    if (isFilled(f.fbclid)) {
      fbclid = f.fbclid;
      clidSource = 'fbc';
      fbclidTs = f.ts || 0;
    }
  }
  if (!fbclidTs) fbclidTs = Number(cookieAttr.ts) || Number(bodyAttr.ts) || 0;

  const gclid =
    [cookieAttr.gclid, bodyAttr.gclid].find(isFilled) || '';
  const resolvedReferrer =
    [referrer, cookieAttr.referrer, bodyAttr.referrer].find(isFilled) || '';
  const resolvedLandingUrl =
    [landingUrl, cookieAttr.landing_url, bodyAttr.landing_url].find(isFilled) || '';

  return {
    utm,
    fbclid,
    fbclidTs: fbclidTs || now,
    gclid,
    referrer: resolvedReferrer,
    landingUrl: resolvedLandingUrl,
    provenance: `utm:${utmSource}|clid:${clidSource}`,
    utmSource,
    clidSource,
  };
}

/**
 * Reconstruct an `_fbc` cookie value from fbclid + click timestamp when
 * the browser's own `_fbc` cookie is missing (Pixel blocked, iOS ITP,
 * in-app browser race). Meta accepts this format from CAPI verbatim.
 * Format: `fb.<subdomainIndex>.<clickTsMs>.<fbclid>`.
 */
export function buildFbc(fbclid: string, tsMs: number): string {
  if (!isFilled(fbclid)) return '';
  return `fb.1.${tsMs || Date.now()}.${fbclid}`;
}

/**
 * L5 — JSON-safe note packer. Guarantees valid JSON under `max` chars
 * by shortening the LONGEST value iteratively. Replaces the anti-pattern
 * `truncate(JSON.stringify(obj), 256)` which sliced mid-JSON on a long
 * campaign name → the webhook's JSON.parse threw → the defensive catch
 * returned `{}` → every field in the blob was lost, not one clipped.
 * A realistic Advantage+ campaign name produces a 335-char blob.
 */
export function packJsonNote(obj: Record<string, unknown>, max = 256): string {
  const w: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    w[k] = typeof v === 'string' ? v : String(v ?? '');
  }
  let json = JSON.stringify(w);
  let guard = 0;
  while (json.length > max && guard < 200) {
    guard += 1;
    let longestKey: string | null = null;
    let longestLen = 0;
    for (const [k, v] of Object.entries(w)) {
      if (v.length > longestLen) {
        longestLen = v.length;
        longestKey = k;
      }
    }
    if (!longestKey || longestLen === 0) break;
    const cut = Math.max(1, Math.min(longestLen, json.length - max));
    w[longestKey] = w[longestKey].slice(0, longestLen - cut);
    json = JSON.stringify(w);
  }
  return json.length > max ? '{}' : json;
}

/** Shorthand truncate for individual note values (fbc, fbp, ip, ua, etc). */
export function truncateNote(v: string | undefined | null, max = 256): string {
  if (!v) return '';
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}
