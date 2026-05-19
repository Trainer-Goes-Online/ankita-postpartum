import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { validateCoupon } from '@/lib/coupons';

// ── OPTIONAL BLOCK: META CONVERSIONS API ─────────────────────────────────────
// Per BACKEND_SOP.md: this block executes only when META_PIXEL_ID and
// META_CAPI_ACCESS_TOKEN are both present. If CAPI is permanently not required
// for this client, delete this function and the block in the POST handler.

type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
};

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Meta CAPI normalization rules — see META_CAPI_OPTIMIZATION_GUIDE.md.
// Each helper returns the hashed value or undefined when the field is empty
// so we don't ship a sha256 of the empty string (which would still match).
function hashEmail(email: string): string | undefined {
  const v = email.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}
function hashPhone(phone: string): string | undefined {
  // E.164 without "+": digits only.
  const v = phone.replace(/\D/g, '');
  return v ? sha256Hex(v) : undefined;
}
function hashName(name: string): string | undefined {
  const v = name.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}
function hashCity(city: string): string | undefined {
  // Strip everything that's not a-z — Meta spec, e.g. "New Delhi" → "newdelhi".
  const v = city.toLowerCase().replace(/[^a-z]/g, '');
  return v ? sha256Hex(v) : undefined;
}
function hashCountry(country: string): string | undefined {
  // ISO 3166-1 alpha-2, lowercase.
  const v = country.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}

/**
 * Fires TWO events in a single POST: the standard "Purchase" (drives campaign
 * optimization + AEM iOS auto-priority) and the custom "sales" event (internal
 * source-of-truth label). Both share event_id, event_source_url, user_data,
 * and custom_data — only event_name differs.
 */
async function sendMetaCapiEvents(params: {
  pixelId: string;
  accessToken: string;
  paymentId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
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

  const userData = {
    ...(em && { em: [em] }),
    ...(ph && { ph: [ph] }),
    ...(fn && { fn: [fn] }),
    ...(ln && { ln: [ln] }),
    ...(ct && { ct: [ct] }),
    ...(country && { country: [country] }),
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
// ── END OPTIONAL BLOCK ────────────────────────────────────────────────────────

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phone: string;
  countryCode: string;
  dialCode: string;
}

interface UtmData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
}

/**
 * Fetch the authoritative payment record from Razorpay. We trust this over the
 * client because the amount might have been discounted by a coupon — Pabbly +
 * CAPI must reflect what was actually paid, not the list price.
 */
async function fetchActualPaidAmount(paymentId: string): Promise<{
  amountPaise: number;
  currency: string;
}> {
  const fallback = {
    amountPaise: CHECKOUT_CONFIG.amountPaise,
    currency: CHECKOUT_CONFIG.currency,
  };
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return fallback;
  }
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const payment = await razorpay.payments.fetch(paymentId);
    const amount = typeof payment.amount === 'string' ? parseInt(payment.amount, 10) : payment.amount;
    if (typeof amount === 'number' && Number.isFinite(amount)) {
      return { amountPaise: amount, currency: String(payment.currency ?? CHECKOUT_CONFIG.currency) };
    }
  } catch (err) {
    console.error('[verify-payment] Could not fetch payment record:', err);
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      paymentId,
      signature,
      customer,
      utm,
      couponCode,
      freeOrderToken,
      eventSourceUrl,
    }: {
      orderId: string;
      paymentId?: string;
      signature?: string;
      customer: CustomerData;
      utm: UtmData;
      couponCode?: string;
      freeOrderToken?: string;
      eventSourceUrl?: string;
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing order ID.' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('[verify-payment] Razorpay secret not configured');
      return NextResponse.json(
        { success: false, error: 'Payment verification not configured.' },
        { status: 500 }
      );
    }

    let resolvedPaymentId: string;
    let paidAmountPaise: number;
    let paidCurrency: string;

    // ── Free-order branch ──────────────────────────────────────────────────
    // Triggered when create-order issued a free-order token (100%-off coupon).
    // We re-validate the coupon AND verify the HMAC, so the client can't fake
    // a free order by guessing an orderId pattern.
    const isFreeOrder = orderId.startsWith('free_') && !!freeOrderToken;
    if (isFreeOrder) {
      if (!couponCode) {
        return NextResponse.json(
          { success: false, error: 'Free-order flow requires a coupon code.' },
          { status: 400 }
        );
      }
      const coupon = validateCoupon(couponCode);
      if (!coupon.ok || coupon.finalAmountPaise !== 0) {
        return NextResponse.json(
          { success: false, error: 'Coupon no longer valid for a free order.' },
          { status: 400 }
        );
      }
      const expectedToken = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${coupon.code}|free`)
        .digest('hex');
      if (!freeOrderToken || expectedToken !== freeOrderToken) {
        return NextResponse.json(
          { success: false, error: 'Free-order token mismatch.' },
          { status: 400 }
        );
      }
      // Authoritative free-order info
      resolvedPaymentId = `free_pay_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      paidAmountPaise = 0;
      paidCurrency = CHECKOUT_CONFIG.currency;
    } else {
      // ── Standard paid-order branch ───────────────────────────────────────
      if (!paymentId || !signature) {
        return NextResponse.json(
          { success: false, error: 'Missing required payment fields.' },
          { status: 400 }
        );
      }

      // HMAC-SHA256 of "orderId|paymentId" — Razorpay protocol requirement
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { success: false, error: 'Payment verification failed.' },
          { status: 400 }
        );
      }

      // Pull the authoritative amount from Razorpay so coupon-discounted orders
      // report the actual paid amount in Pabbly + CAPI.
      const fetched = await fetchActualPaidAmount(paymentId);
      resolvedPaymentId = paymentId;
      paidAmountPaise = fetched.amountPaise;
      paidCurrency = fetched.currency;
    }

    const paidAmountRupeesString = (paidAmountPaise / 100).toString();
    const paidAmountRupeesNumeric = paidAmountPaise / 100;

    // Payment verified — build Pabbly payload
    const now = new Date();
    const pabblyPayload = {
      first_name:        customer.firstName,
      last_name:         customer.lastName,
      full_name:         `${customer.firstName} ${customer.lastName}`,
      email:             customer.email,
      phone:             `${customer.dialCode}${customer.phone}`,
      city:              customer.city,
      country_code:      customer.countryCode,
      payment_id:        resolvedPaymentId,
      order_id:          orderId,
      amount:            paidAmountRupeesString,
      currency:          paidCurrency,
      coupon_code:       couponCode ?? '',
      free_order:        isFreeOrder,
      payment_date:      now.toLocaleDateString('en-IN', { timeZone: CHECKOUT_CONFIG.paymentTimezone }),
      payment_time:      now.toLocaleTimeString('en-IN', { timeZone: CHECKOUT_CONFIG.paymentTimezone }),
      payment_timestamp: now.toISOString(),
      utm_source:        utm?.source   ?? '',
      utm_medium:        utm?.medium   ?? '',
      utm_campaign:      utm?.campaign ?? '',
      utm_content:       utm?.content  ?? '',
      utm_term:          utm?.term     ?? '',
      utm_id:            utm?.id       ?? '',
    };

    console.log('[verify-payment] Verified purchase:', pabblyPayload);

    // Fire Pabbly webhook (non-blocking — errors never surface to the user)
    const webhookUrl = process.env.PABBLY_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pabblyPayload),
        });
        if (webhookResponse.ok) {
          console.log('[verify-payment] Pabbly webhook successful:', webhookResponse.status);
        } else {
          console.error('[verify-payment] Pabbly webhook failed:', webhookResponse.status, webhookResponse.statusText);
        }
      } catch (err) {
        console.error('[verify-payment] Pabbly webhook error:', err);
      }
    } else {
      console.error('[verify-payment] CRITICAL: PABBLY_WEBHOOK_URL not set — webhook skipped');
    }

    // ── OPTIONAL BLOCK: META CONVERSIONS API ─────────────────────────────────
    // Fires TWO events in a single POST: standard "Purchase" + custom "sales".
    // Both events fire only on the real production domain AND only for paid
    // orders — localhost, Vercel preview URLs, and free QA-coupon orders are
    // deliberately skipped so test data doesn't pollute Meta's pixel.
    const requestHost = (req.headers.get('host') ?? '')
      .toLowerCase()
      .split(':')[0]; // strip ":3001" etc.
    const isProductionHost = CHECKOUT_CONFIG.capi.productionHosts.includes(requestHost);

    // Pixel ID is exposed to the browser too (NEXT_PUBLIC_), so prefer that;
    // fall back to META_PIXEL_ID for older setups.
    const metaPixelId =
      process.env.NEXT_PUBLIC_META_PIXEL_ID ?? process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (isFreeOrder) {
      console.log('[verify-payment] Meta CAPI skipped — free order (100%-off coupon)');
    } else if (!isProductionHost) {
      console.log(
        `[verify-payment] Meta CAPI skipped — request host "${requestHost}" is not a production domain (allowed: ${CHECKOUT_CONFIG.capi.productionHosts.join(', ')})`,
      );
    } else if (metaPixelId && metaAccessToken) {
      const fbc = req.cookies.get('_fbc')?.value;
      const fbp = req.cookies.get('_fbp')?.value;
      const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        req.headers.get('x-real-ip') ??
        undefined;
      const clientUserAgent = req.headers.get('user-agent') ?? undefined;
      const fullPhone = `${customer.dialCode}${customer.phone}`;

      // Restricted-category accounts require event_source_url on every event
      // or Meta drops them after the 60-day enforcement deadline. Prefer the
      // client-sent URL (window.location.href at the moment of verify); fall
      // back to the production checkout URL when missing.
      const resolvedEventSourceUrl =
        eventSourceUrl?.trim() || CHECKOUT_CONFIG.capi.fallbackEventSourceUrl;

      // Read the bodyworx_utm cookie (written by <UtmCapture/> on every page
      // mount). Decoded shape: { source, medium, campaign, content, term, id }.
      let utm: Utm = {};
      const utmCookieRaw = req.cookies.get(CHECKOUT_CONFIG.utmSessionKey)?.value;
      if (utmCookieRaw) {
        try {
          utm = JSON.parse(decodeURIComponent(utmCookieRaw)) as Utm;
        } catch {
          // Bad cookie value — ignore and continue with empty UTM payload.
        }
      }

      try {
        const capiResult = await sendMetaCapiEvents({
          pixelId: metaPixelId,
          accessToken: metaAccessToken,
          paymentId: resolvedPaymentId,
          email: customer.email,
          phone: fullPhone,
          firstName: customer.firstName,
          lastName: customer.lastName,
          city: customer.city,
          country: customer.countryCode,
          fbc,
          fbp,
          clientIp,
          clientUserAgent,
          eventSourceUrl: resolvedEventSourceUrl,
          valueRupees: paidAmountRupeesNumeric,
          currency: paidCurrency,
          utm,
        });
        console.log(
          `[verify-payment] Meta CAPI "${CHECKOUT_CONFIG.capi.standardEventName}" + "${CHECKOUT_CONFIG.capi.customEventName}" events sent:`,
          capiResult,
        );
      } catch (err) {
        console.error('[verify-payment] Meta CAPI error:', err);
      }
    } else {
      console.error('[verify-payment] Meta CAPI skipped — META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set');
    }
    // ── END OPTIONAL BLOCK ────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      paymentId: resolvedPaymentId,
      amount: paidAmountRupeesNumeric,
      currency: paidCurrency,
      freeOrder: isFreeOrder,
    });
  } catch (error) {
    console.error('[verify-payment]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
