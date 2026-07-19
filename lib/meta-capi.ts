import crypto from 'crypto';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

/**
 * Shared Meta Conversions API primitives.
 *
 * Extracted from the previous verify-payment route so the new Razorpay
 * webhook (`/api/razorpay/webhook`) + the new intent-event routes
 * (`/api/meta/add-to-cart`, `/api/meta/initiate-checkout`) all share ONE
 * source of truth for hashing rules + the tripwire dual-event sender.
 *
 * Nothing in the tripwire event payload has changed byte-for-byte vs. the
 * previous verify-payment implementation.
 */

export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
};

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phone: string;
  countryCode: string;
  dialCode: string;
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Meta CAPI normalization rules — each helper returns undefined when the
// field is empty so we don't ship a sha256 of the empty string (which
// would still match).
export function hashEmail(email: string): string | undefined {
  const v = email.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}
export function hashPhone(phone: string): string | undefined {
  // E.164 without "+": digits only.
  const v = phone.replace(/\D/g, '');
  return v ? sha256Hex(v) : undefined;
}
export function hashName(name: string): string | undefined {
  const v = name.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}
export function hashCity(city: string): string | undefined {
  // Strip everything that's not a-z — Meta spec, e.g. "New Delhi" → "newdelhi".
  const v = city.toLowerCase().replace(/[^a-z]/g, '');
  return v ? sha256Hex(v) : undefined;
}
export function hashCountry(country: string): string | undefined {
  // ISO 3166-1 alpha-2, lowercase.
  const v = country.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}

/**
 * Fires TWO tripwire events in a single POST: the standard "Purchase"
 * (drives campaign optimization + AEM iOS auto-priority) and the custom
 * "sales" event (internal source-of-truth label). Both share event_id,
 * event_source_url, user_data, and custom_data — only event_name differs.
 *
 * Preserved byte-for-byte from the previous verify-payment route so Meta
 * sees zero payload change post-migration.
 */
export async function sendMetaCapiEvents(params: {
  pixelId: string;
  accessToken: string;
  paymentId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  externalId: string | undefined;
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
  eventSourceUrl: string;
  valueRupees: number;
  currency: string;
  utm: Utm;
}) {
  const em = hashEmail(params.email);
  const ph = hashPhone(params.phone);
  const fn = hashName(params.firstName);
  const ln = hashName(params.lastName);
  const ct = hashCity(params.city);
  const country = hashCountry(params.country);
  // External ID is the bw_uid cookie value (anonymous UUID). Hashing rules:
  // trim + lowercase + sha256 — must match the browser pixel's internal
  // hashing so Meta sees one identity across browser PageView + CAPI events.
  const externalId = params.externalId
    ? sha256Hex(params.externalId.trim().toLowerCase())
    : undefined;

  const userData = {
    ...(em && { em: [em] }),
    ...(ph && { ph: [ph] }),
    ...(fn && { fn: [fn] }),
    ...(ln && { ln: [ln] }),
    ...(ct && { ct: [ct] }),
    ...(country && { country: [country] }),
    ...(externalId && { external_id: [externalId] }),
    // Raw (unhashed) per Meta spec — hashing breaks them as matching signals.
    ...(params.fbc && { fbc: params.fbc }),
    ...(params.fbp && { fbp: params.fbp }),
    ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
    ...(params.clientIp && { client_ip_address: params.clientIp }),
  };

  const customData = {
    currency: params.currency,
    value: params.valueRupees,
    payment_id: params.paymentId,
    ...(params.utm.source && { utm_source: params.utm.source }),
    ...(params.utm.medium && { utm_medium: params.utm.medium }),
    ...(params.utm.campaign && { utm_campaign: params.utm.campaign }),
    ...(params.utm.content && { utm_content: params.utm.content }),
    ...(params.utm.term && { utm_term: params.utm.term }),
    ...(params.utm.id && { utm_id: params.utm.id }),
  };

  const eventBase = {
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.paymentId,
    action_source: 'website',
    event_source_url: params.eventSourceUrl,
    user_data: userData,
    custom_data: customData,
  };

  const payload = {
    data: [
      { event_name: CHECKOUT_CONFIG.capi.standardEventName, ...eventBase },
      { event_name: CHECKOUT_CONFIG.capi.customEventName,   ...eventBase },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v25.0/${params.pixelId}/events?access_token=${params.accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}
