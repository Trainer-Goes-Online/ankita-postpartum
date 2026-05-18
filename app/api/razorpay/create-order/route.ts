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
 * For 100%-off coupons we can't create a Razorpay order (₹0 is below Razorpay's
 * minimum). Instead we mint a server-signed free-order token. verify-payment
 * recomputes this HMAC to confirm the free order is legitimate — without it,
 * a client could fabricate any `free_xxx` order ID and trigger a fake Pabbly
 * webhook. Signing key is RAZORPAY_KEY_SECRET (already server-only).
 */
function signFreeOrder(orderId: string, couponCode: string): string {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${couponCode}|free`)
    .digest('hex');
}

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
    const rawCoupon = typeof body.couponCode === 'string' ? body.couponCode : '';

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
    // skips the Razorpay modal and calls verify-payment directly.
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

    // ── Standard paid-order branch ─────────────────────────────────────────
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: coupon?.ok ? { coupon_code: coupon.code } : undefined,
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
