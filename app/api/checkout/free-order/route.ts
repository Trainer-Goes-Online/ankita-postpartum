import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { validateCoupon } from '@/lib/coupons';
import { hashEmail, type Utm } from '@/lib/meta-capi';

/**
 * POST /api/checkout/free-order
 *
 * Free-coupon (tgotest2025) QA path. Razorpay is bypassed entirely (₹0
 * orders are below Razorpay's minimum), so the webhook can't fire — this
 * tiny route replaces the free-order branch of the deleted verify-payment
 * route. Pabbly only; Meta CAPI is deliberately skipped for QA orders.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Server not configured.' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      orderId,
      freeOrderToken,
      couponCode,
      customer,
      utm,
      eventSourceUrl,
    }: {
      orderId?: string;
      freeOrderToken?: string;
      couponCode?: string;
      customer?: {
        firstName: string;
        lastName: string;
        email: string;
        city: string;
        phone: string;
        countryCode: string;
        dialCode: string;
        occupation?: string;
      };
      utm?: Utm;
      eventSourceUrl?: string;
    } = body;

    if (!orderId || !freeOrderToken || !couponCode || !customer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 },
      );
    }

    // Validate coupon.
    const coupon = validateCoupon(couponCode);
    if (!coupon.ok || coupon.finalAmountPaise !== 0) {
      return NextResponse.json(
        { success: false, error: 'Coupon no longer valid for a free order.' },
        { status: 400 },
      );
    }
    // HMAC verify the free-order token (issued by create-order).
    const expectedToken = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${coupon.code}|free`)
      .digest('hex');
    if (expectedToken !== freeOrderToken) {
      return NextResponse.json(
        { success: false, error: 'Free-order token mismatch.' },
        { status: 400 },
      );
    }

    const paymentId = `free_pay_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    // Read request-level signals so the CRM row has the same shape as a
    // real paid order (minus real payment id).
    const fbc = req.cookies.get('_fbc')?.value ?? '';
    const fbp = req.cookies.get('_fbp')?.value ?? '';
    const fbclid = req.cookies.get('bw_fbclid')?.value ?? '';
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      '';
    const clientUserAgent = req.headers.get('user-agent') ?? '';
    const resolvedEventSourceUrl =
      eventSourceUrl?.trim() || CHECKOUT_CONFIG.capi.fallbackEventSourceUrl;
    const externalIdEmailHash = hashEmail(customer.email) ?? '';

    const now = new Date();
    const pabblyPayload = {
      first_name:        customer.firstName,
      last_name:         customer.lastName,
      full_name:         `${customer.firstName} ${customer.lastName}`,
      email:             customer.email,
      phone:             `${customer.dialCode}${customer.phone}`,
      city:              customer.city,
      country_code:      customer.countryCode,
      payment_id:        paymentId,
      order_id:          orderId,
      amount:            '0',
      currency:          CHECKOUT_CONFIG.currency,
      coupon_code:       coupon.code,
      free_order:        true,
      payment_date:      now.toLocaleDateString('en-IN', { timeZone: CHECKOUT_CONFIG.paymentTimezone }),
      payment_time:      now.toLocaleTimeString('en-IN', { timeZone: CHECKOUT_CONFIG.paymentTimezone }),
      payment_timestamp: now.toISOString(),
      utm_source:        utm?.source   ?? '',
      utm_medium:        utm?.medium   ?? '',
      utm_campaign:      utm?.campaign ?? '',
      utm_content:       utm?.content  ?? '',
      utm_term:          utm?.term     ?? '',
      utm_id:            utm?.id       ?? '',
      lead_id:           paymentId,
      created_at:        now.toISOString(),
      fbc:               fbc,
      fbp:               fbp,
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      external_id:       externalIdEmailHash,
      event_source_url:  resolvedEventSourceUrl,
      is_test:           'true',
      purchase_event_id: paymentId,
      fbclid:            fbclid,
      occupation:        customer.occupation ?? '',
    };

    const webhookUrl = process.env.PABBLY_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const r = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pabblyPayload),
        });
        if (r.ok) console.log('[free-order] Pabbly sent:', r.status);
        else console.error('[free-order] Pabbly failed:', r.status);
      } catch (err) {
        console.error('[free-order] Pabbly threw:', err);
      }
    }

    return NextResponse.json({
      success: true,
      paymentId,
      amount: 0,
      currency: CHECKOUT_CONFIG.currency,
      freeOrder: true,
    });
  } catch (err) {
    console.error('[free-order] fatal:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
