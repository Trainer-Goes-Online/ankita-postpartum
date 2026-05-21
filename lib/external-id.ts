'use client';

/**
 * External ID — anonymous, persistent, pseudonymous browser identifier.
 *
 * Generated once per browser on first visit, stored in the bw_uid first-party
 * cookie for 365 days. Included on every Meta event (browser PageView via
 * fbq init + server CAPI Purchase + sales via user_data.external_id) so Meta
 * can stitch a user's PageViews to their eventual conversion across visits
 * and devices in the same browser.
 *
 * The value is a UUID v4 — opaque, high-entropy, not PII. Meta hashes the
 * raw value on the browser side; the server pre-hashes with the same
 * normalization (trim + lowercase) so the hash output matches across both
 * channels.
 */

const COOKIE_NAME = 'bw_uid';
const COOKIE_TTL_DAYS = 365;

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

function generateUuid(): string {
  // Modern browsers (Chrome 92+, Safari 15.4+, Firefox 95+) expose
  // crypto.randomUUID. Fall back to a manual v4 builder for older clients.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the existing bw_uid cookie value, or creates + persists a new UUID
 * if no cookie exists. Always returns a non-empty string on the client.
 */
export function getOrCreateExternalId(): string {
  if (typeof document === 'undefined') return '';
  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;
  const created = generateUuid();
  writeCookie(COOKIE_NAME, created, COOKIE_TTL_DAYS);
  return created;
}
