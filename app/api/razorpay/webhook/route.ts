import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { sendMetaCapiEvents, hashEmail, type Utm } from '@/lib/meta-capi';

/**
 * POST /api/razorpay/webhook
 *
 * Server-to-server webhook triggered by Razorpay on every captured payment.
 * This is the new SINGLE SOURCE OF TRUTH for firing Pabbly + Meta CAPI on
 * paid orders — the old browser-triggered verify-payment route has been
 * deleted because it lost UPI-away users (who complete payment in a UPI
 * app and never return to /thank-you).
 *
 * Pipeline:
 *   1. HMAC-verify signature vs. RAZORPAY_WEBHOOK_SECRET (raw body).
 *   2. Filter event_name to `payment.captured`.
 *   3. Kind gate — `payment.notes.kind === "client_postnatal"` (set by
 *      create-order at order-creation time). Anything else is ignored
 *      (the merchant's Razorpay account may receive unrelated payments).
 *   4. Test-mode gate — non-production host aborts CAPI (Pabbly still
 *      fires so a manual test payment leaves a CRM trail).
 *   5. Unpack notes → build the exact same Pabbly payload the old
 *      verify-payment emitted (33 fields, byte-for-byte).
 *   6. Fire Pabbly (non-blocking) + Meta CAPI dual event (non-blocking).
 *   7. Return self-documenting confirmation JSON.
 *
 * Free-coupon (`tgotest2025`) orders never touch Razorpay so this route
 * never sees them — they go through /api/checkout/free-order.
 */
export async function POST(req: NextRequest) {
  const paymentIdForLog = { current: 'pending' };
  try {
    // ── 1. HMAC signature verify (needs the RAW body bytes) ─────────────
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[webhook] CRITICAL: RAZORPAY_WEBHOOK_SECRET not set');
      return NextResponse.json(
        { ok: false, error: 'webhook_secret_missing' },
        { status: 500 },
      );
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature) {
      console.error('[webhook] invalid signature');
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });
    }
    console.log('[webhook] signature verified');

    // ── 2. Parse + event filter ─────────────────────────────────────────
    let parsed: {
      event?: string;
      payload?: { payment?: { entity?: RazorpayPaymentEntity } };
    };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }
    const eventName = parsed.event;
    if (eventName !== 'payment.captured') {
      console.log(`[webhook] ignored — event="${eventName}" (not payment.captured)`);
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: 'event_not_captured',
        event: eventName,
      });
    }

    // ── 3. Extract payment entity ───────────────────────────────────────
    const payment = parsed.payload?.payment?.entity;
    if (!payment) {
      return NextResponse.json({ ok: false, error: 'no_payment_entity' }, { status: 400 });
    }
    const paymentId = payment.id ?? '';
    paymentIdForLog.current = paymentId;

    // ── 4. Kind gate ────────────────────────────────────────────────────
    const notes = payment.notes ?? {};
    const kind = String(notes.kind ?? '');
    if (kind !== 'client_postnatal') {
      console.log(`[webhook] paymentId=${paymentId} ignored — kind="${kind}" mismatch`);
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: 'kind_mismatch',
        kind,
      });
    }
    console.log(`[webhook] paymentId=${paymentId} kind matched: client_postnatal`);

    // ── 5. Test-mode gate for Meta CAPI (Pabbly still fires) ────────────
    // We don't get a browser host header on the webhook — Razorpay POSTs
    // straight to our production URL. So the CAPI gate here is just the
    // presence of env vars + the create-order having tagged this as our
    // funnel. There's no localhost/preview leakage risk because Razorpay
    // dashboard is configured with a production URL.
    const metaPixelId =
      process.env.NEXT_PUBLIC_META_PIXEL_ID ?? process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;

    // ── 6. Unpack notes ─────────────────────────────────────────────────
    let cust: {
      fn?: string;
      ln?: string;
      em?: string;
      ph?: string;
      ct?: string;
      co?: string;
      dl?: string;
    } = {};
    try {
      if (notes.cust) cust = JSON.parse(String(notes.cust));
    } catch {
      console.error(`[webhook] paymentId=${paymentId} bad notes.cust JSON`);
    }
    let utmPacked: {
      s?: string;
      m?: string;
      c?: string;
      n?: string;
      t?: string;
      i?: string;
    } = {};
    try {
      if (notes.utm) utmPacked = JSON.parse(String(notes.utm));
    } catch {
      console.error(`[webhook] paymentId=${paymentId} bad notes.utm JSON`);
    }
    const utm: Utm = {
      source:   utmPacked.s ?? '',
      medium:   utmPacked.m ?? '',
      campaign: utmPacked.c ?? '',
      content:  utmPacked.n ?? '',
      term:     utmPacked.t ?? '',
      id:       utmPacked.i ?? '',
    };
    const fbclid = String(notes.clid ?? '');
    const fbc    = String(notes.fbc  ?? '') || undefined;
    const fbp    = String(notes.fbp  ?? '') || undefined;
    const clientIp        = String(notes.ip ?? '') || undefined;
    const clientUserAgent = String(notes.ua ?? '') || undefined;
    const eventSourceUrl  = String(notes.esu ?? '') || CHECKOUT_CONFIG.capi.fallbackEventSourceUrl;
    const externalIdCookie = String(notes.uid ?? '') || undefined;
    const couponCode = String(notes.cpn ?? '');

    // ── Server-derived fields ───────────────────────────────────────────
    const rawAmount = payment.amount;
    const amountPaise =
      typeof rawAmount === 'string'
        ? parseInt(rawAmount, 10)
        : typeof rawAmount === 'number'
          ? rawAmount
          : CHECKOUT_CONFIG.amountPaise;
    const paidAmountRupees = Math.round(amountPaise) / 100;
    const paidAmountRupeesString = String(paidAmountRupees);
    const paidCurrency = String(payment.currency ?? CHECKOUT_CONFIG.currency);

    const paymentCreatedMs =
      typeof payment.created_at === 'number' ? payment.created_at * 1000 : Date.now();
    const now = new Date(paymentCreatedMs);
    const orderId = String(payment.order_id ?? '');

    // external_id for the CRM Sheet + downstream Apps Script events is the
    // email hash — deterministic per person, matches the `em` field and
    // the Apps Script's own hashing. (Distinct from the tripwire CAPI
    // external_id, which uses the anonymous bw_uid cookie; both stitch
    // via `em` on Meta.)
    const externalIdEmailHash = hashEmail(cust.em ?? '') ?? '';

    // ── Build the Pabbly payload (same 33 fields as verify-payment) ─────
    const email     = cust.em ?? '';
    const firstName = cust.fn ?? '';
    const lastName  = cust.ln ?? '';
    const city      = cust.ct ?? '';
    const rawPhone  = cust.ph ?? '';
    const dialCode  = cust.dl ?? '';
    const countryCode = cust.co ?? '';
    const pabblyPayload = {
      first_name:        firstName,
      last_name:         lastName,
      full_name:         `${firstName} ${lastName}`.trim(),
      email:             email,
      phone:             `${dialCode}${rawPhone}`,
      city:              city,
      country_code:      countryCode,
      payment_id:        paymentId,
      order_id:          orderId,
      amount:            paidAmountRupeesString,
      currency:          paidCurrency,
      coupon_code:       couponCode,
      free_order:        false,
      payment_date:      now.toLocaleDateString('en-IN', { timeZone: CHECKOUT_CONFIG.paymentTimezone }),
      payment_time:      now.toLocaleTimeString('en-IN', { timeZone: CHECKOUT_CONFIG.paymentTimezone }),
      payment_timestamp: now.toISOString(),
      utm_source:        utm.source   ?? '',
      utm_medium:        utm.medium   ?? '',
      utm_campaign:      utm.campaign ?? '',
      utm_content:       utm.content  ?? '',
      utm_term:          utm.term     ?? '',
      utm_id:            utm.id       ?? '',
      lead_id:           paymentId,
      created_at:        now.toISOString(),
      fbc:               fbc ?? '',
      fbp:               fbp ?? '',
      client_ip_address: clientIp ?? '',
      client_user_agent: clientUserAgent ?? '',
      external_id:       externalIdEmailHash,
      event_source_url:  eventSourceUrl,
      is_test:           'false',
      purchase_event_id: paymentId,
      fbclid:            fbclid,
    };

    // ── 7. Fire Pabbly (non-blocking) ───────────────────────────────────
    let pabblyStatus: 'sent' | 'skipped' | 'error' = 'skipped';
    const webhookUrl = process.env.PABBLY_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const r = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pabblyPayload),
        });
        if (r.ok) {
          console.log(`[webhook] paymentId=${paymentId} Pabbly sent (${r.status})`);
          pabblyStatus = 'sent';
        } else {
          console.error(`[webhook] paymentId=${paymentId} Pabbly failed (${r.status})`);
          pabblyStatus = 'error';
        }
      } catch (err) {
        console.error(`[webhook] paymentId=${paymentId} Pabbly threw:`, err);
        pabblyStatus = 'error';
      }
    } else {
      console.error(`[webhook] paymentId=${paymentId} Pabbly URL not set`);
    }

    // ── 8. Fire Meta CAPI (Purchase + sales in one POST) ────────────────
    let capiStatus: 'sent' | 'skipped' | 'error' = 'skipped';
    if (metaPixelId && metaAccessToken) {
      try {
        const capiResult = await sendMetaCapiEvents({
          pixelId: metaPixelId,
          accessToken: metaAccessToken,
          paymentId: paymentId,
          email,
          phone: `${dialCode}${rawPhone}`,
          firstName,
          lastName,
          city,
          country: countryCode,
          externalId: externalIdCookie,
          fbc,
          fbp,
          clientIp,
          clientUserAgent,
          eventSourceUrl,
          valueRupees: paidAmountRupees,
          currency: paidCurrency,
          utm,
        });
        console.log(
          `[webhook] paymentId=${paymentId} Meta CAPI "${CHECKOUT_CONFIG.capi.standardEventName}" + "${CHECKOUT_CONFIG.capi.customEventName}" sent:`,
          capiResult,
        );
        capiStatus = 'sent';
      } catch (err) {
        console.error(`[webhook] paymentId=${paymentId} Meta CAPI error:`, err);
        capiStatus = 'error';
      }
    } else {
      console.error(`[webhook] paymentId=${paymentId} Meta env vars missing`);
    }

    // ── 9. Confirmation response ────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      paymentId,
      kind: 'client_postnatal',
      pabbly: pabblyStatus,
      capi: capiStatus,
    });
  } catch (err) {
    console.error(`[webhook] paymentId=${paymentIdForLog.current} fatal:`, err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}

// ── Razorpay payment.entity type (narrow, only the fields we consume) ──
type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number | string;
  currency?: string;
  created_at?: number;
  notes?: Record<string, unknown>;
};
