'use client';

/**
 * Manual Advanced Matching (MAM) for the Meta browser pixel.
 *
 * We capture identifiers at two moments in the funnel:
 *   1. While the user is filling the checkout form — a debounced effect in
 *      app/checkout/page.tsx calls writeMam() 500ms after the form becomes
 *      fully valid. This means abandoners who completed the form leave a
 *      30-day MAM cookie behind; any return visit (landing or any page)
 *      fires PageView with full hashed user_data.
 *   2. After a successful conversion — handlePaymentSuccess +
 *      handleFreeOrderSuccess re-write MAM as a defence-in-depth.
 *
 * Storage: first-party cookie `bw_mam` with a 30-day TTL (matches our
 * existing bodyworx_utm cookie). Contains ONLY SHA-256 hashes — never plain
 * PII. Same-origin, SameSite=Lax — mirrors Meta's own _fbp/_fbc cookies.
 *
 * Hashing happens client-side via SubtleCrypto. Normalization rules mirror
 * the server (app/api/razorpay/verify-payment/route.ts) exactly so the hash
 * output matches what CAPI sends — Meta sees consistent user_data across
 * browser pixel + Conversions API.
 */

const COOKIE_NAME = 'bw_mam';
const COOKIE_TTL_DAYS = 30;

export type MamHashedData = {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  country?: string;
};

export type MamPlainInput = {
  email: string;
  phone: string;     // full international number — normalized to digits before hashing
  firstName: string;
  lastName: string;
  city: string;
  country: string;   // 2-letter ISO (e.g. "IN")
};

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Must match server-side rules in app/api/razorpay/verify-payment/route.ts
// character-for-character so browser pixel + CAPI emit identical hashes.
const normEmail   = (v: string) => v.trim().toLowerCase();
const normPhone   = (v: string) => v.replace(/\D/g, '');
const normName    = (v: string) => v.trim().toLowerCase();
const normCity    = (v: string) => v.toLowerCase().replace(/[^a-z]/g, '');
const normCountry = (v: string) => v.trim().toLowerCase();

async function hashIfPresent(value: string): Promise<string | undefined> {
  return value ? sha256Hex(value) : undefined;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export async function writeMam(plain: MamPlainInput): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const [em, ph, fn, ln, ct, country] = await Promise.all([
      hashIfPresent(normEmail(plain.email)),
      hashIfPresent(normPhone(plain.phone)),
      hashIfPresent(normName(plain.firstName)),
      hashIfPresent(normName(plain.lastName)),
      hashIfPresent(normCity(plain.city)),
      hashIfPresent(normCountry(plain.country)),
    ]);
    const hashed: MamHashedData = {
      ...(em && { em }),
      ...(ph && { ph }),
      ...(fn && { fn }),
      ...(ln && { ln }),
      ...(ct && { ct }),
      ...(country && { country }),
    };
    if (Object.keys(hashed).length === 0) return;
    writeCookie(COOKIE_NAME, JSON.stringify(hashed), COOKIE_TTL_DAYS);
  } catch {
    // SubtleCrypto / cookie write may fail in insecure contexts. MAM is
    // incremental — CAPI still carries the full hashed payload server-side.
  }
}

export function readMam(): MamHashedData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = readCookie(COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MamHashedData;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
