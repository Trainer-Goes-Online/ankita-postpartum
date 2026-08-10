import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { validateCoupon, type CouponResult } from '@/lib/coupons';

let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * For 100%-off coupons we can't create a Razorpay order (₹0 is below
 * Razorpay's minimum). Instead we mint a server-signed free-order token.
 * /api/checkout/free-order recomputes this HMAC to confirm the free order
 * is legitimate. Signing key is RAZORPAY_KEY_SECRET (server-only).
 */
function signFreeOrder(orderId: string, couponCode: string): string {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${couponCode}|free`)
    .digest('hex');
}

/**
 * Razorpay allows 15 note keys, 256 chars per value. To move ~20 customer
 * + attribution fields from the browser into the webhook, we consolidate
 * into JSON blobs for `cust` + `utm` and keep the rest as top-level keys.
 */
function truncate(v: string | undefined | null, max = 256): string {
  if (!v) return '';
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

// Canonical checkout URL — no query string. Real URLs routinely blow past
// 256 chars because of ?utm_*&fbclid=… params, and the query-string data
// is already preserved in the `utm` + `clid` notes. Meta CAPI's
// `event_source_url` is a metadata field (not a matching signal) — no
// EMQ hit from canonicalizing.
const CANONICAL_CHECKOUT_URL = 'https://bodyworx.in/checkout';

type CustomerBody = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phone: string;
  countryCode: string;
  dialCode: string;
  occupation?: string;
};

type UtmBody = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  id?: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[create-order] Razorpay not configured — missing environment variables');
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawCoupon: string = typeof body.couponCode === 'string' ? body.couponCode : '';
    const customer: CustomerBody | undefined = body.customer;
    const utm: UtmBody | undefined = body.utm;
    const fbclid: string = typeof body.fbclid === 'string' ? body.fbclid : '';

    let amount: number = CHECKOUT_CONFIG.amountPaise;
    const currency: string = CHECKOUT_CONFIG.currency;
    let coupon: CouponResult | null = null;

    if (rawCoupon.trim()) {
      coupon = validateCoupon(rawCoupon);
      if (coupon.ok) {
        amount = coupon.finalAmountPaise;
      }
    }

    // ── Free-order branch ──────────────────────────────────────────────────
    // Razorpay rejects ₹0 orders. When a coupon makes the order free, we
    // bypass Razorpay entirely and return a signed token. The CheckoutForm
    // skips the Razorpay modal and calls /api/checkout/free-order.
    if (coupon && coupon.ok && coupon.finalAmountPaise === 0) {
      const freeOrderId = `free_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const freeOrderToken = signFreeOrder(freeOrderId, coupon.code);
      return NextResponse.json({
        orderId: freeOrderId,
        amount: 0,
        currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        coupon,
        freeOrder: true,
        freeOrderToken,
      });
    }

    // ── Standard paid-order branch — pack notes for the webhook ────────────
    // Server-side signals we need to hand to the webhook because the webhook
    // is server-to-server and shares no browser session with the buyer.
    const fbc = req.cookies.get('_fbc')?.value;
    const fbp = req.cookies.get('_fbp')?.value;
    const bwUid = req.cookies.get('bw_uid')?.value;
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      '';
    const clientUserAgent = req.headers.get('user-agent') ?? '';

    const custBlob = JSON.stringify({
      fn: customer?.firstName ?? '',
      ln: customer?.lastName  ?? '',
      em: customer?.email     ?? '',
      ph: customer?.phone     ?? '',
      ct: customer?.city      ?? '',
      co: customer?.countryCode ?? '',
      dl: customer?.dialCode  ?? '',
      oc: customer?.occupation ?? '',
    });
    const utmBlob = JSON.stringify({
      s: utm?.source   ?? '',
      m: utm?.medium   ?? '',
      c: utm?.campaign ?? '',
      n: utm?.content  ?? '',
      t: utm?.term     ?? '',
      i: utm?.id       ?? '',
    });

    const notes: Record<string, string> = {
      kind: 'client_postnatal',
      cust: truncate(custBlob),
      utm:  truncate(utmBlob),
      clid: truncate(fbclid),
      fbc:  truncate(fbc),
      fbp:  truncate(fbp),
      ip:   truncate(clientIp, 45),
      ua:   truncate(clientUserAgent),
      esu:  CANONICAL_CHECKOUT_URL,
      cpn:  truncate(coupon?.ok ? coupon.code : ''),
      uid:  truncate(bwUid, 64),
    };

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      coupon,
      freeOrder: false,
    });
  } catch (error) {
    console.error('[create-order]', error);
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}
