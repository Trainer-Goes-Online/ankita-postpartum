/**
 * Coupon validation — server-authoritative.
 * The client may attach a couponCode to /api/razorpay/create-order, but the
 * server is the ONLY component that determines the final amount. Never trust
 * the client to compute the discount.
 */
import { CHECKOUT_CONFIG } from './checkout-config';

export type CouponSuccess = {
  ok: true;
  code: string;
  /** Final paise amount that will be charged via Razorpay. */
  finalAmountPaise: number;
  /** Final amount expressed in rupees as a string — for display & Pabbly. */
  finalAmountRupeesString: string;
  /** Final amount expressed in rupees as a number — for CAPI. */
  finalAmountRupeesNumeric: number;
  /** Original list price (rupees) so the UI can render the strike-through. */
  originalAmountRupeesNumeric: number;
  /** Human-readable note shown next to the applied coupon. */
  discountReason: string;
};

export type CouponFailure = { ok: false; error: string };

export type CouponResult = CouponSuccess | CouponFailure;

/**
 * Normalize and validate. Returns either ok-success (apply this amount) or
 * ok-failure (display this error). Never throws.
 */
export function validateCoupon(rawCode: string): CouponResult {
  const code = (rawCode ?? '').trim().toLowerCase();
  if (!code) return { ok: false, error: 'Enter a coupon code.' };

  switch (code) {
    case 'tgotest2025':
      // Agency QA coupon — 100% off. Skips Razorpay entirely (no card needed),
      // so it works even when international payments are disabled on the
      // Razorpay account. The free-order flow is HMAC-signed server-side
      // (see app/api/razorpay/create-order/route.ts) so the client can't fake
      // a free order. Pabbly + CAPI receive amount=0 so test registrations
      // are visually distinct from real ₹297 sales in the CRM.
      return {
        ok: true,
        code: 'tgotest2025',
        finalAmountPaise: 0,
        finalAmountRupeesString: '0',
        finalAmountRupeesNumeric: 0,
        originalAmountRupeesNumeric: CHECKOUT_CONFIG.amountRupeesNumeric,
        discountReason: 'Agency test coupon (100% off)',
      };

    default:
      return { ok: false, error: 'Coupon code not valid.' };
  }
}
