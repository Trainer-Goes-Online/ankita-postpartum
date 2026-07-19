import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { sendInitiateCheckoutEvent } from '@/lib/meta-events';
import type { CustomerData } from '@/lib/meta-capi';

/**
 * POST /api/meta/initiate-checkout
 *
 * Fires the `InitiateCheckout` Meta CAPI event AFTER the checkout form has
 * been fully validated AND the Razorpay modal has opened (the client only
 * calls this route from the paid path once the order is created — the
 * free-coupon QA path MUST NOT hit this route).
 *
 * Client sends `{customer, eventSourceUrl}`; this route reads cookies +
 * headers to enrich the 11-signal payload identical to the tripwire
 * `sales` event.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      customer,
      eventSourceUrl,
    }: {
      customer?: CustomerData;
      eventSourceUrl?: string;
    } = body;

    if (!customer?.email) {
      return NextResponse.json(
        { ok: false, error: 'missing_customer_email' },
        { status: 400 },
      );
    }

    const requestHost = (req.headers.get('host') ?? '')
      .toLowerCase()
      .split(':')[0];
    const isProductionHost = CHECKOUT_CONFIG.capi.productionHosts.includes(requestHost);
    if (!isProductionHost) {
      console.log(`[ic] skipped — non-production host "${requestHost}"`);
      return NextResponse.json({ ok: true, capi: 'skipped', reason: 'test_mode' });
    }

    const metaPixelId =
      process.env.NEXT_PUBLIC_META_PIXEL_ID ?? process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (!metaPixelId || !metaAccessToken) {
      console.error('[ic] skipped — META_PIXEL_ID or META_CAPI_ACCESS_TOKEN missing');
      return NextResponse.json({ ok: true, capi: 'skipped', reason: 'env_missing' });
    }

    const fbc = req.cookies.get('_fbc')?.value;
    const fbp = req.cookies.get('_fbp')?.value;
    const externalId = req.cookies.get('bw_uid')?.value;
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined;
    const clientUserAgent = req.headers.get('user-agent') ?? undefined;
    const resolvedEventSourceUrl =
      eventSourceUrl?.trim() || CHECKOUT_CONFIG.capi.fallbackEventSourceUrl;

    const fullPhone = `${customer.dialCode}${customer.phone}`;

    try {
      const result = await sendInitiateCheckoutEvent({
        pixelId: metaPixelId,
        accessToken: metaAccessToken,
        email: customer.email,
        phone: fullPhone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        city: customer.city,
        country: customer.countryCode,
        externalId,
        fbc,
        fbp,
        clientIp,
        clientUserAgent,
        eventSourceUrl: resolvedEventSourceUrl,
        valueRupees: CHECKOUT_CONFIG.amountRupeesNumeric,
        currency: CHECKOUT_CONFIG.currency,
      });
      console.log('[ic] InitiateCheckout sent:', result);
      return NextResponse.json({ ok: true, capi: 'sent' });
    } catch (err) {
      console.error('[ic] Meta CAPI error:', err);
      return NextResponse.json({ ok: true, capi: 'error' });
    }
  } catch (err) {
    console.error('[ic] fatal:', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
