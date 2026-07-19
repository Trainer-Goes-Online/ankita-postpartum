import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { sendAddToCartEvent } from '@/lib/meta-events';

/**
 * POST /api/meta/add-to-cart
 *
 * Fires the `AddToCart` Meta CAPI event when a visitor clicks any landing
 * CTA. The client sends a sendBeacon POST with just `{eventSourceUrl}`;
 * this route reads _fbc/_fbp from cookies and IP/UA from headers, gates
 * on the same production-host allow-list as the tripwire Purchase, and
 * fires exactly one event to Meta.
 *
 * Client-side localStorage dedup (bw_atc_fired) handles the "once per
 * browser" guarantee; Meta's 48h event_id dedup is the safety net.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventSourceUrl: string | undefined = body?.eventSourceUrl;

    // Same host gate as verify-payment/webhook — localhost + previews skip.
    const requestHost = (req.headers.get('host') ?? '')
      .toLowerCase()
      .split(':')[0];
    const isProductionHost = CHECKOUT_CONFIG.capi.productionHosts.includes(requestHost);
    if (!isProductionHost) {
      console.log(`[atc] skipped — non-production host "${requestHost}"`);
      return NextResponse.json({ ok: true, capi: 'skipped', reason: 'test_mode' });
    }

    const metaPixelId =
      process.env.NEXT_PUBLIC_META_PIXEL_ID ?? process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (!metaPixelId || !metaAccessToken) {
      console.error('[atc] skipped — META_PIXEL_ID or META_CAPI_ACCESS_TOKEN missing');
      return NextResponse.json({ ok: true, capi: 'skipped', reason: 'env_missing' });
    }

    const fbc = req.cookies.get('_fbc')?.value;
    const fbp = req.cookies.get('_fbp')?.value;
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined;
    const clientUserAgent = req.headers.get('user-agent') ?? undefined;
    const resolvedEventSourceUrl =
      eventSourceUrl?.trim() || CHECKOUT_CONFIG.capi.fallbackEventSourceUrl;

    try {
      const result = await sendAddToCartEvent({
        pixelId: metaPixelId,
        accessToken: metaAccessToken,
        fbc,
        fbp,
        clientIp,
        clientUserAgent,
        eventSourceUrl: resolvedEventSourceUrl,
        valueRupees: CHECKOUT_CONFIG.amountRupeesNumeric,
        currency: CHECKOUT_CONFIG.currency,
      });
      console.log('[atc] AddToCart sent:', result);
      return NextResponse.json({ ok: true, capi: 'sent' });
    } catch (err) {
      console.error('[atc] Meta CAPI error:', err);
      return NextResponse.json({ ok: true, capi: 'error' });
    }
  } catch (err) {
    console.error('[atc] fatal:', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
