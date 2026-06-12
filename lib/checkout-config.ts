/**
 * Postpartum challenge — checkout config (single source of truth).
 *
 * Env-controlled so they can be changed without touching code:
 *
 *     NEXT_PUBLIC_OFFER_PRICE_RUPEES=497         # what the user pays
 *     NEXT_PUBLIC_OFFER_LIST_PRICE_RUPEES=1660   # strikethrough "was" price
 *     NEXT_PUBLIC_WEBINAR_DATE=25th May          # batch start date
 *     NEXT_PUBLIC_WEBINAR_TIMES=6 AM, 4 PM & 7 PM IST
 *     NEXT_PUBLIC_WHATSAPP_INVITE_URL=https://chat.whatsapp.com/...
 */

function parsePriceEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const PRICE_RUPEES = parsePriceEnv(process.env.NEXT_PUBLIC_OFFER_PRICE_RUPEES, 497);
const LIST_PRICE_RUPEES = parsePriceEnv(
  process.env.NEXT_PUBLIC_OFFER_LIST_PRICE_RUPEES,
  1660
);
const WEBINAR_DATE = process.env.NEXT_PUBLIC_WEBINAR_DATE?.trim() || '25th May';
const WEBINAR_TIMES =
  process.env.NEXT_PUBLIC_WEBINAR_TIMES?.trim() || '6 AM, 4 PM & 7 PM IST';
const WHATSAPP_INVITE_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL?.trim() ||
  'https://chat.whatsapp.com/K7EEYdn7tbuFkPcDuk0ZLv';

export const CHECKOUT_CONFIG = {
  amountPaise: PRICE_RUPEES * 100,
  amountRupeesString: String(PRICE_RUPEES),
  amountRupeesNumeric: PRICE_RUPEES,
  listPriceRupees: LIST_PRICE_RUPEES,
  savingsRupees: Math.max(0, LIST_PRICE_RUPEES - PRICE_RUPEES),
  currency: 'INR',
  paymentTimezone: 'Asia/Kolkata',

  razorpayModal: {
    name: 'BodyWorx',
    description: '5-Day Postpartum Recovery Challenge',
    themeColor: '#F24C69',
  },

  capi: {
    // Two events fire from CAPI per successful transaction (single POST,
    // 2-element data array). The standard "Purchase" event drives campaign
    // optimization + AEM iOS auto-priority; the custom "sales" event is our
    // internal source-of-truth label. Both share event_id, user_data,
    // event_source_url, and custom_data.
    standardEventName: 'Purchase',
    customEventName: 'sales',
    value: PRICE_RUPEES,
    currency: 'INR',
    // CAPI fires only when the request's host matches one of these.
    // Localhost + Vercel preview URLs (*.vercel.app) are deliberately excluded
    // so test purchases don't pollute Meta's pixel data.
    productionHosts: ['bodyworx.in', 'www.bodyworx.in'],
    // Used when the client doesn't send eventSourceUrl. Restricted-category
    // accounts require event_source_url on every event or Meta drops them.
    fallbackEventSourceUrl: 'https://bodyworx.in/checkout',
  },

  thankYouPath: '/thank-you',
  funnelSlug: 'postpartum-challenge',
  utmSessionKey: 'bodyworx_utm',

  webinarDate: WEBINAR_DATE,
  webinarTimes: WEBINAR_TIMES,
  whatsappInviteUrl: WHATSAPP_INVITE_URL,
};
