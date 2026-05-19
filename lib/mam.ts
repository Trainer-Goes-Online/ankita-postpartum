'use client';

/**
 * Manual Advanced Matching (MAM) for the Meta browser pixel.
 *
 * After a successful checkout we hash the customer's identifiers and stash
 * them in sessionStorage. <MetaPixel/> reads them on the next mount/route
 * change and passes them to fbq('init', PIXEL_ID, hashedMam) so subsequent
 * `track` events carry the full hashed user_data — same EMQ-boosting
 * matching signal that our server-side CAPI sends.
 *
 * Hashing happens client-side via SubtleCrypto. We pre-hash before storing
 * so sessionStorage holds only hashed values (defence in depth). The
 * normalization rules mirror the server (verify-payment/route.ts) exactly
 * so the hash output matches what CAPI sends — Meta sees consistent
 * user_data across both sources.
 *
 * sessionStorage (not localStorage):
 *   - tab-scoped, cleared when the tab closes
 *   - never serialized to disk
 *   - not shared across browser sessions
 */

const STORAGE_KEY = 'bw_mam';

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
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(hashed));
  } catch {
    // SubtleCrypto / sessionStorage may be unavailable (insecure context,
    // private mode, quota exceeded). MAM is incremental — CAPI still carries
    // the full hashed payload server-side, so we silently skip.
  }
}

export function readMam(): MamHashedData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MamHashedData;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
