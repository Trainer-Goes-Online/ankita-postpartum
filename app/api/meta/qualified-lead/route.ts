import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import { sendQualifiedLeadEvent } from '@/lib/meta-events';
import {
  ATTR_COOKIE,
  readAttrCookie,
  resolveAttribution,
} from '@/lib/attribution';

/**
 * POST /api/meta/qualified-lead
 *
 * Fires the custom `QualifiedLead` Meta CAPI event when a visitor selects
 * "Working Professional" in the checkout occupation dropdown. The client
 * dedupes with bw_ql_fired so this endpoint should only see one hit per
 * browser under normal use — Meta's 48h event_id dedup is the safety net.
 *
 * Body: `{customer, eventSourceUrl}`. Customer may be partially filled
 * (email/phone empty) if the visitor picks occupation before typing the
 * form — that's fine; we only send hashed fields we actually have.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      customer,
      eventSourceUrl,
    }: {
      customer?: {
        firstName: string;
        lastName: string;
        email: string;
        city: string;
        phone: string;
        countryCode: string;
        dialCode: string;
      };
      eventSourceUrl?: string;
    } = body;

    // customer object is expected but individual fields may be blank.
    if (!customer) {
      return NextResponse.json({ ok: false, error: 'missing_customer' }, { status: 400 });
    }

    const requestHost = (req.headers.get('host') ?? '')
      .toLowerCase()
      .split(':')[0];
    const isProductionHost = CHECKOUT_CONFIG.capi.productionHosts.includes(requestHost);
    if (!isProductionHost) {
      console.log(`[ql] skipped — non-production host "${requestHost}"`);
      return NextResponse.json({ ok: true, capi: 'skipped', reason: 'test_mode' });
    }

    const metaPixelId =
      process.env.NEXT_PUBLIC_META_PIXEL_ID ?? process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (!metaPixelId || !metaAccessToken) {
      console.error('[ql] skipped — META_PIXEL_ID or META_CAPI_ACCESS_TOKEN missing');
      return NextResponse.json({ ok: true, capi: 'skipped', reason: 'env_missing' });
    }

    const fbcCookie = req.cookies.get('_fbc')?.value;
    const fbp = req.cookies.get('_fbp')?.value;
    const externalId = req.cookies.get('bw_uid')?.value;
    // L4 — build _fbc from bw_attr's fbclid+ts if the browser cookie
    // is empty (Pixel blocked / iOS ITP / in-app race).
    const attr = readAttrCookie(req.cookies.get(ATTR_COOKIE)?.value);
    const resolved = resolveAttribution({
      cookieAttr: attr,
      referrer: req.headers.get('referer') ?? '',
      landingUrl: attr.landing_url ?? '',
      fbc: fbcCookie ?? '',
    });
    const fbc =
      fbcCookie ||
      (resolved.fbclid ? `fb.1.${resolved.fbclidTs}.${resolved.fbclid}` : undefined);
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined;
    const clientUserAgent = req.headers.get('user-agent') ?? undefined;
    const resolvedEventSourceUrl =
      eventSourceUrl?.trim() || CHECKOUT_CONFIG.capi.fallbackEventSourceUrl;

    const fullPhone = customer.phone
      ? `${customer.dialCode}${customer.phone}`
      : '';

    try {
      const result = await sendQualifiedLeadEvent({
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
      });
      console.log('[ql] QualifiedLead sent:', result);
      return NextResponse.json({ ok: true, capi: 'sent' });
    } catch (err) {
      console.error('[ql] Meta CAPI error:', err);
      return NextResponse.json({ ok: true, capi: 'error' });
    }
  } catch (err) {
    console.error('[ql] fatal:', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
