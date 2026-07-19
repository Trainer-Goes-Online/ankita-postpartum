import { sha256Hex, hashEmail, hashPhone, hashName, hashCity, hashCountry } from '@/lib/meta-capi';

/**
 * Meta CAPI intent-event senders — AddToCart + InitiateCheckout.
 *
 * These fire independently of the payment webhook — see architecture note
 * in META_ATC_IC_SOP.md §0. AddToCart triggers when the user clicks a
 * landing CTA (server route: /api/meta/add-to-cart). InitiateCheckout
 * triggers when the user has a fully-validated form AND the Razorpay
 * modal has opened (server route: /api/meta/initiate-checkout).
 *
 * Dataset is NOT categorized as H&W, so we ship the full PII payload
 * matching our existing `sales` posture (6 hashed fields + external_id
 * + raw fbc/fbp/IP/UA). Event names use Meta's standard vocabulary —
 * `AddToCart` and `InitiateCheckout` — for optimal AEM iOS priority.
 */

/**
 * AddToCart — no PII available at CTA click time. Only signals we have
 * are fbc/fbp cookies + IP + UA. Expected EMQ: 3–5 (data-availability
 * ceiling, not a bug).
 */
export async function sendAddToCartEvent(params: {
  pixelId: string;
  accessToken: string;
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
  eventSourceUrl: string;
  valueRupees: number;
  currency: string;
}) {
  // event_id — deterministic per browser so Meta's 48h dedup collapses
  // accidental double-fires from rapid clicks / multi-tab. Falls back to
  // random hex if _fbp cookie is missing (ad-blocker case).
  const eventId = params.fbp
    ? sha256Hex(`${params.fbp}|atc`)
    : `${sha256Hex(`${Date.now()}_${Math.random()}`)}_atc`;

  const userData = {
    // No PII available at CTA click time — no em/ph/fn/ln/ct/country.
    ...(params.fbc && { fbc: params.fbc }),
    ...(params.fbp && { fbp: params.fbp }),
    ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
    ...(params.clientIp && { client_ip_address: params.clientIp }),
  };

  const customData = {
    currency: params.currency,
    value: params.valueRupees,
    content_ids: ['postnatal_recovery_challenge'],
    content_name: '5-Day Postpartum Recovery Challenge',
    content_type: 'product',
  };

  const payload = {
    data: [
      {
        event_name: 'AddToCart',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: params.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v25.0/${params.pixelId}/events?access_token=${params.accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}

/**
 * InitiateCheckout — fires after form validation passes AND Razorpay modal
 * has opened. Full 11-signal payload identical to the `sales` conversion
 * event's user_data shape. Expected EMQ: 9+.
 */
export async function sendInitiateCheckoutEvent(params: {
  pixelId: string;
  accessToken: string;
  email: string;
  phone: string;                // full international number
  firstName: string;
  lastName: string;
  city: string;
  country: string;              // 2-letter ISO
  externalId: string | undefined; // raw bw_uid cookie value
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
  eventSourceUrl: string;
  valueRupees: number;
  currency: string;
}) {
  const em = hashEmail(params.email);
  const ph = hashPhone(params.phone);
  const fn = hashName(params.firstName);
  const ln = hashName(params.lastName);
  const ct = hashCity(params.city);
  const country = hashCountry(params.country);
  // external_id: matches tripwire `sales` derivation exactly (sha256 of
  // trimmed lowercased bw_uid). Meta stitches ATC → IC → Purchase across
  // the same anonymous browser UUID.
  const externalId = params.externalId
    ? sha256Hex(params.externalId.trim().toLowerCase())
    : undefined;

  // event_id — deterministic per email so Meta dedupes double-clicks +
  // multi-tab attempts by the same real user, even across sessions
  // within 48h.
  const emailNorm = params.email.trim().toLowerCase();
  const eventId = emailNorm
    ? sha256Hex(`${emailNorm}|ic`)
    : `${sha256Hex(`${Date.now()}_${Math.random()}`)}_ic`;

  const userData = {
    ...(em && { em: [em] }),
    ...(ph && { ph: [ph] }),
    ...(fn && { fn: [fn] }),
    ...(ln && { ln: [ln] }),
    ...(ct && { ct: [ct] }),
    ...(country && { country: [country] }),
    ...(externalId && { external_id: [externalId] }),
    ...(params.fbc && { fbc: params.fbc }),
    ...(params.fbp && { fbp: params.fbp }),
    ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
    ...(params.clientIp && { client_ip_address: params.clientIp }),
  };

  const customData = {
    currency: params.currency,
    value: params.valueRupees,
    content_ids: ['postnatal_recovery_challenge'],
    content_name: '5-Day Postpartum Recovery Challenge',
    content_type: 'product',
  };

  const payload = {
    data: [
      {
        event_name: 'InitiateCheckout',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: params.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v25.0/${params.pixelId}/events?access_token=${params.accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}
