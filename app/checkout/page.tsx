'use client';

/**
 * /checkout — 2-column checkout for the 5-Day Postpartum Recovery
 * Challenge funnel. Self-contained (no navbar, inline palette), routes
 * success → /thank-you. Reuses the production-tested Razorpay endpoints
 * (/api/razorpay/create-order + /api/razorpay/verify-payment) and the
 * tgotest2025 coupon (100% off via HMAC-signed free-order token).
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import {
  ShieldCheck,
  Lock,
  CheckCircle,
  Tag,
  ArrowLeft,
  ArrowRight,
  CaretDown,
  X,
  CreditCard,
  Lightning,
  Clock,
  Sparkle,
  Heart,
} from '@phosphor-icons/react/dist/ssr';
import PaymentLogos from '@/components/PaymentLogos';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import type { CouponResult, CouponSuccess } from '@/lib/coupons';
import { readUtmCookie, readUtmFromUrl, writeUtmCookie } from '@/lib/utm';
import { writeMam } from '@/lib/mam';

// ── Palette (isolated) ───────────────────────────────────────────────────────
const C = {
  brand: '#F24C69',
  deep: '#C73A57',
  bright: '#FF6E88',
  blush: '#FCE4EA',
  cream: '#FFF7F9',
  ink: '#1F1014',
  inkSoft: '#4B2A33',
  inkMuted: '#8C6B74',
  line: '#F2D6DD',
  whisper: '#FDF3F5',
  black: '#0A0A0A',
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const VALUE_TOTAL = 10000;

// ── Razorpay types ───────────────────────────────────────────────────────────
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// ── Country data ─────────────────────────────────────────────────────────────
interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}
const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
];

// ── Validation ───────────────────────────────────────────────────────────────
const NAME_RE = /^[a-zA-Z\s\-'.]{2,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phone: string;
}
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  phone?: string;
}

function validateFields(fields: FormFields, countryCode: string): FormErrors {
  const errors: FormErrors = {};
  if (!fields.firstName.trim()) errors.firstName = 'First name is required.';
  else if (!NAME_RE.test(fields.firstName.trim()))
    errors.firstName = 'Letters, spaces, and hyphens only.';
  if (!fields.lastName.trim()) errors.lastName = 'Last name is required.';
  else if (!NAME_RE.test(fields.lastName.trim()))
    errors.lastName = 'Letters, spaces, and hyphens only.';
  if (!fields.email.trim()) errors.email = 'Email address is required.';
  else if (!EMAIL_RE.test(fields.email.trim())) errors.email = 'Enter a valid email address.';
  if (!fields.city.trim()) errors.city = 'City is required.';
  else if (fields.city.trim().length < 2) errors.city = 'Enter your city name.';
  if (!fields.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      try {
        const fullNumber = `${country.dial}${fields.phone.trim()}`;
        const valid = isValidPhoneNumber(
          fullNumber,
          countryCode as Parameters<typeof isValidPhoneNumber>[1],
        );
        if (!valid) errors.phone = `Invalid number for ${country.name}.`;
      } catch {
        errors.phone = 'Enter a valid phone number.';
      }
    }
  }
  return errors;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NewCheckoutPage() {
  return (
    <main style={{ background: C.cream, color: C.ink }} className="min-h-screen overflow-x-hidden font-body">
      <MinimalHeader />
      <CheckoutBody />
      {/* Global footer renders from app/layout.tsx */}
    </main>
  );
}

// ── Header — pink-gradient backdrop, brand mark on left, Back on right ──────
function MinimalHeader() {
  return (
    <header
      className="relative"
      style={{
        background: `linear-gradient(180deg, ${C.whisper} 0%, ${C.blush} 100%)`,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 md:px-8">
        {/* Brand mark — heart-in-pink-tile + BODYWORX wordmark */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm sm:h-11 sm:w-11"
            style={{
              background: `linear-gradient(160deg, ${C.brand}, ${C.deep})`,
              boxShadow: '0 8px 20px -8px rgba(199,58,87,0.45)',
            }}
          >
            <Heart weight="fill" className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
          </span>
          <span
            className="font-heading text-[18px] font-extrabold tracking-[0.06em] sm:text-[20px]"
            style={{ color: C.ink }}
          >
            BODYWORX
          </span>
        </div>

        {/* Back link — right side */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold transition-colors hover:opacity-70 sm:text-[14px]"
          style={{ color: C.ink }}
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back
        </Link>
      </div>
    </header>
  );
}

// ── Body — 2-col layout: form left, sticky summary right ─────────────────────
function CheckoutBody() {
  return (
    <section className="py-8 md:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
        {/* Heading */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-8 text-center sm:mb-10 md:mb-12"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:gap-2 sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]"
            style={{ background: C.blush, color: C.deep }}
          >
            <Sparkle weight="fill" className="h-3 w-3 shrink-0" />
            <span className="truncate sm:overflow-visible sm:whitespace-normal">5-Day Postpartum Recovery Challenge</span>
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-4 font-heading text-[22px] font-extrabold leading-tight sm:text-[28px] md:text-[36px]"
            style={{ color: C.ink }}
          >
            Add Your Payment Details.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-2 text-[13.5px] sm:text-[14.5px]"
            style={{ color: C.inkMuted }}
          >
            One step away from your live recovery reset.
          </motion.p>
        </motion.div>

        {/* 2-column grid */}
        <CheckoutGrid />
      </div>
    </section>
  );
}

function CheckoutGrid() {
  const router = useRouter();

  const [fields, setFields] = useState<FormFields>({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormFields, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    city: false,
    phone: false,
  });
  const [countryCode, setCountryCode] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponSuccess | null>(null);

  const finalRupees = appliedCoupon
    ? appliedCoupon.finalAmountRupeesNumeric
    : CHECKOUT_CONFIG.amountRupeesNumeric;

  useEffect(() => {
    const urlUtm = readUtmFromUrl(window.location.search);
    writeUtmCookie(urlUtm);
  }, []);

  // Form-fill Manual Advanced Matching capture.
  // Debounced 500ms after the last keystroke — when the entire form is
  // validly filled, hash identifiers and persist to the bw_mam cookie. This
  // is what lifts PageView EMQ across the user's future visits: even if
  // they bail without paying, the 30-day cookie means any return visit
  // (landing, /checkout, any page) fires PageView with the full hashed
  // user_data block. The post-conversion writeMam calls in
  // handlePaymentSuccess / handleFreeOrderSuccess remain as a defence in
  // depth in case the 500ms window never elapsed (e.g. ultra-fast submit).
  useEffect(() => {
    const validationErrors = validateFields(fields, countryCode);
    if (Object.keys(validationErrors).length > 0) return;

    const timer = setTimeout(() => {
      const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
      writeMam({
        email: fields.email.trim(),
        phone: `${selectedCountry.dial}${fields.phone.trim()}`,
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        city: fields.city.trim(),
        country: countryCode,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [fields, countryCode]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  function handleChange(field: keyof FormFields, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (touched[field]) {
      const updated = { ...fields, [field]: value };
      const newErrors = validateFields(updated, countryCode);
      setErrors((e) => ({ ...e, [field]: newErrors[field] }));
    }
  }
  function handleBlur(field: keyof FormFields) {
    setTouched((t) => ({ ...t, [field]: true }));
    const newErrors = validateFields(fields, countryCode);
    setErrors((e) => ({ ...e, [field]: newErrors[field] }));
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code }),
      });
      if (!res.ok) throw new Error('Could not validate coupon.');
      const json: { coupon?: CouponResult } = await res.json();
      const coupon = json.coupon;
      if (coupon && coupon.ok) {
        setAppliedCoupon(coupon);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(coupon && 'error' in coupon ? coupon.error : 'Coupon code not valid.');
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : 'Could not validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, city: true, phone: true });
    const allErrors = validateFields(fields, countryCode);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstErrorKey = Object.keys(allErrors)[0] as keyof FormFields;
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: appliedCoupon?.code ?? '' }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error ?? 'Could not initiate payment.');
      }

      const { orderId, keyId, amount, currency, coupon, freeOrder, freeOrderToken } =
        (await orderRes.json()) as {
          orderId: string;
          keyId: string;
          amount: number;
          currency: string;
          coupon: CouponResult | null;
          freeOrder?: boolean;
          freeOrderToken?: string;
        };

      if (appliedCoupon && (!coupon || !coupon.ok)) {
        throw new Error('Coupon is no longer valid. Please remove it and try again.');
      }

      const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

      // Free-order branch (tgotest2025 = 100% off)
      if (freeOrder && freeOrderToken && coupon?.ok) {
        await handleFreeOrderSuccess({
          orderId,
          freeOrderToken,
          couponCode: coupon.code,
          dialCode: selectedCountry.dial,
        });
        return;
      }

      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Payment system unavailable. Please refresh and try again.');
      }

      const rzp = new window.Razorpay({
        key: keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
        amount,
        currency,
        order_id: orderId,
        name: 'BodyWorx',
        description: '5-Day Postpartum Recovery Challenge',
        prefill: {
          name: `${fields.firstName.trim()} ${fields.lastName.trim()}`,
          email: fields.email.trim(),
          contact: `${selectedCountry.dial}${fields.phone.trim()}`,
        },
        theme: { color: CHECKOUT_CONFIG.razorpayModal.themeColor },
        handler: async (response) => {
          await handlePaymentSuccess(response, selectedCountry.dial);
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      showToast(msg);
    }
  }

  async function handleFreeOrderSuccess(params: {
    orderId: string;
    freeOrderToken: string;
    couponCode: string;
    dialCode: string;
  }) {
    try {
      const utm = readUtmCookie();
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: params.orderId,
          freeOrderToken: params.freeOrderToken,
          couponCode: params.couponCode,
          customer: {
            firstName: fields.firstName.trim(),
            lastName: fields.lastName.trim(),
            email: fields.email.trim(),
            city: fields.city.trim(),
            phone: fields.phone.trim(),
            countryCode,
            dialCode: params.dialCode,
          },
          utm,
          // Sent for symmetry with the paid path — server ignores it on free
          // orders (CAPI block is guarded out for free orders).
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
      const result = await verifyRes.json();
      if (!result.success) throw new Error(result.error ?? 'Free registration failed.');
      // Stash hashed identifiers in sessionStorage so the next PageView
      // (/thank-you) carries Manual Advanced Matching data — same hashes as
      // server CAPI sends, so Meta sees a consistent user_data block across
      // browser + server.
      await writeMam({
        email: fields.email.trim(),
        phone: `${params.dialCode}${fields.phone.trim()}`,
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        city: fields.city.trim(),
        country: countryCode,
      });
      router.push(buildTYUrl({ amount: 0, currency: result.currency ?? 'INR', free: true }));
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Could not complete free registration.';
      showToast(msg);
    }
  }

  async function handlePaymentSuccess(response: RazorpayResponse, dialCode: string) {
    try {
      const utm = readUtmCookie();
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          customer: {
            firstName: fields.firstName.trim(),
            lastName: fields.lastName.trim(),
            email: fields.email.trim(),
            city: fields.city.trim(),
            phone: fields.phone.trim(),
            countryCode,
            dialCode,
          },
          utm,
          // The URL where the conversion happened — passed to Meta CAPI as
          // event_source_url. Required for restricted-category accounts.
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
      const result = await verifyRes.json();
      if (!result.success) throw new Error(result.error ?? 'Payment verification failed.');
      // Stash hashed identifiers in sessionStorage so the next PageView
      // (/thank-you) carries Manual Advanced Matching data — same hashes as
      // server CAPI sends, so Meta sees a consistent user_data block across
      // browser + server.
      await writeMam({
        email: fields.email.trim(),
        phone: `${dialCode}${fields.phone.trim()}`,
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        city: fields.city.trim(),
        country: countryCode,
      });
      router.push(buildTYUrl({ amount: result.amount, currency: result.currency }));
    } catch (err) {
      setLoading(false);
      const msg =
        err instanceof Error
          ? err.message
          : 'Payment received but verification failed. Please contact us.';
      showToast(msg);
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl px-4 py-3 text-sm text-white shadow-xl"
          style={{ background: C.black }}
        >
          <span className="flex-1">{toast}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-white/70 hover:text-white"
          >
            <X weight="bold" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
        {/* LEFT: form (renders below summary on mobile) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="order-2 overflow-hidden rounded-3xl p-5 sm:p-6 md:p-8 lg:order-1"
          style={{ background: 'white', border: `1px solid ${C.line}`, boxShadow: '0 30px 80px -40px rgba(199,58,87,0.25)' }}
        >
          <h2 className="font-heading text-[20px] font-extrabold sm:text-[22px]" style={{ color: C.ink }}>
            Your Details
          </h2>
          <p className="mt-1 text-[13.5px]" style={{ color: C.inkMuted }}>
            We&apos;ll send your Zoom link and welcome guide to this email.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-7">
            {/* `minmax(0, 1fr)` lets columns shrink below their content width
                so a wide child (like the coupon button) can't force the
                grid wider than its parent on narrow phones. */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="First Name"
                  placeholder="Priya"
                  value={fields.firstName}
                  error={errors.firstName}
                  touched={touched.firstName}
                  onChange={(v) => handleChange('firstName', v)}
                  onBlur={() => handleBlur('firstName')}
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label="Last Name"
                  placeholder="Sharma"
                  value={fields.lastName}
                  error={errors.lastName}
                  touched={touched.lastName}
                  onChange={(v) => handleChange('lastName', v)}
                  onBlur={() => handleBlur('lastName')}
                  autoComplete="family-name"
                />
              </div>

              <Field
                id="email"
                label="Email Address"
                type="email"
                placeholder="priya@example.com"
                value={fields.email}
                error={errors.email}
                touched={touched.email}
                onChange={(v) => handleChange('email', v)}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
                inputMode="email"
              />

              <Field
                id="city"
                label="Town / City"
                placeholder="Mumbai"
                value={fields.city}
                error={errors.city}
                touched={touched.city}
                onChange={(v) => handleChange('city', v)}
                onBlur={() => handleBlur('city')}
                autoComplete="address-level2"
              />

              <div id="field-phone" className="flex flex-col">
                <label htmlFor="phone" className="mb-1.5 text-[13px] font-semibold" style={{ color: C.ink }}>
                  Phone Number <span style={{ color: C.brand }}>*</span>
                </label>
                <PhoneInput
                  value={fields.phone}
                  countryCode={countryCode}
                  onValueChange={(v) => handleChange('phone', v)}
                  onCountryChange={(code) => {
                    setCountryCode(code);
                    if (touched.phone) {
                      const newErrors = validateFields(fields, code);
                      setErrors((e) => ({ ...e, phone: newErrors.phone }));
                    }
                  }}
                  error={errors.phone}
                  touched={touched.phone}
                  onBlur={() => handleBlur('phone')}
                />
                <span
                  role="alert"
                  className={[
                    'mt-1 text-[11.5px] transition-opacity',
                    touched.phone && !!errors.phone ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                  style={{ color: '#DC2626' }}
                >
                  {errors.phone ?? ' '}
                </span>
              </div>

              {/* Coupon */}
              <CouponSection
                appliedCoupon={appliedCoupon}
                couponOpen={couponOpen}
                couponInput={couponInput}
                couponLoading={couponLoading}
                couponError={couponError}
                onOpen={() => setCouponOpen(true)}
                onInputChange={(v) => {
                  setCouponInput(v);
                  if (couponError) setCouponError(null);
                }}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="group mt-7 inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl py-4 font-heading text-[15px] font-bold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[16px]"
              style={{
                background: `linear-gradient(180deg, ${C.brand}, ${C.deep})`,
                boxShadow: '0 18px 40px -14px rgba(199,58,87,0.55)',
              }}
            >
              {loading ? (
                <>
                  <Spinner /> Processing…
                </>
              ) : finalRupees === 0 ? (
                <>
                  Complete Free Registration
                  <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  Place Your Order · ₹{finalRupees}
                  <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10.5px] sm:text-[11.5px]" style={{ color: C.inkMuted }}>
              <span className="inline-flex items-center gap-1 whitespace-nowrap sm:gap-1.5">
                <Lock weight="fill" className="h-3 w-3 shrink-0" style={{ color: C.brand }} /> Razorpay Secured
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">SSL Encrypted</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">Instant Refund Guarantee</span>
            </div>

            <p className="mt-5 text-center text-[12px] leading-relaxed" style={{ color: C.inkMuted }}>
              Your personal data will be used to process your order, support your experience, and for other purposes
              described in our{' '}
              <a href="#" className="font-semibold underline" style={{ color: C.brand }}>
                privacy policy
              </a>
              .
            </p>

            {/* Payment method strip */}
            <PaymentMethods />
          </form>
        </motion.div>

        {/* RIGHT: sticky summary */}
        <motion.aside
          variants={fadeUp}
          initial="hidden"
          animate="show"
          aria-label="Order summary"
          className="order-1 self-start overflow-hidden rounded-3xl p-4 sm:p-5 md:p-7 lg:order-2 lg:sticky lg:top-6 lg:p-7"
          style={{ background: 'white', border: `1px solid ${C.line}`, boxShadow: '0 30px 80px -40px rgba(199,58,87,0.25)' }}
        >
          <OrderSummary finalRupees={finalRupees} appliedCoupon={appliedCoupon} />
        </motion.aside>
      </div>
    </>
  );
}

function buildTYUrl({ amount, currency, free }: { amount: number; currency: string; free?: boolean }) {
  const utm = readUtmCookie();
  const params = new URLSearchParams({ funnel: 'postpartum-5day' });
  if (utm.source) params.set('utm_source', utm.source);
  if (utm.medium) params.set('utm_medium', utm.medium);
  if (utm.campaign) params.set('utm_campaign', utm.campaign);
  if (utm.content) params.set('utm_content', utm.content);
  if (utm.term) params.set('utm_term', utm.term);
  if (utm.id) params.set('utm_id', utm.id);
  if (typeof amount === 'number') params.set('amt', String(amount));
  if (currency) params.set('cur', currency);
  if (free) params.set('free', '1');
  return `/thank-you?${params.toString()}`;
}

// ── Order summary card ───────────────────────────────────────────────────────
const RECAP: { title: string; value: number }[] = [
  { title: '5-Day Recovery Challenge', value: 2700 },
  { title: 'DR Gap Check & Analysis', value: 900 },
  { title: 'Core & Pelvic Floor Safety Check', value: 900 },
  { title: 'Posture & Back Pain Fix', value: 900 },
  { title: 'Tummy-Flattening Food Guide', value: 1100 },
  { title: 'Personalized Welcome Video', value: 1700 },
  { title: 'Safe Exercise Starter Guide', value: 900 },
  { title: '20 Mom Secrets Guide', value: 900 },
];

function OrderSummary({
  finalRupees,
  appliedCoupon,
}: {
  finalRupees: number;
  appliedCoupon: CouponSuccess | null;
}) {
  const discountAmount = CHECKOUT_CONFIG.amountRupeesNumeric - finalRupees;
  // Mobile-only accordion state. lg+ ignores this and always shows content.
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile-only collapsed header (tap to toggle) ──────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="order-summary-details"
        className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between gap-3 rounded-2xl px-1 py-1 text-left transition-colors lg:hidden lg:pointer-events-none"
      >
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: C.deep }}>
            Order Summary
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMuted }}>
            {open ? 'Tap to hide details' : 'Tap to view details'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-heading text-[22px] font-extrabold leading-none" style={{ color: C.brand }}>
            {finalRupees === 0 ? 'FREE' : `₹${finalRupees}`}
          </span>
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full"
            style={{ background: C.whisper, border: `1px solid ${C.line}` }}
          >
            <CaretDown
              weight="bold"
              className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              style={{ color: C.deep }}
            />
          </span>
        </div>
      </button>

      {/* ── Expandable content — always visible on lg+ ───────────────── */}
      <div
        id="order-summary-details"
        className={[
          open ? 'mt-5 block' : 'hidden',
          'lg:mt-0 lg:block',
        ].join(' ')}
      >
        {/* Desktop-only header (mobile uses the accordion button above) */}
        <div className="hidden lg:block">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: C.deep }}>
            Order Summary
          </p>
          <h2 className="mt-2 font-heading text-[20px] font-extrabold leading-snug sm:text-[22px]" style={{ color: C.ink }}>
            5-Day Postpartum Recovery Challenge
          </h2>
        </div>

        {/* Mobile expansion: show challenge name here so the desktop header
            doesn't duplicate it when collapsed → expanded on mobile. */}
        <h2 className="font-heading text-[20px] font-extrabold leading-snug sm:text-[22px] lg:hidden" style={{ color: C.ink }}>
          5-Day Postpartum Recovery Challenge
        </h2>

        <div
          className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-semibold sm:text-[11px]"
          style={{ background: C.blush, color: C.deep }}
        >
          <Clock weight="fill" className="h-3 w-3 shrink-0" />
          <span className="truncate">Starts {CHECKOUT_CONFIG.webinarDate} · {CHECKOUT_CONFIG.webinarTimes}</span>
        </div>

      {/* Item line */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl p-3" style={{ background: C.whisper, border: `1px solid ${C.line}` }}>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14"
          style={{ background: `linear-gradient(160deg, ${C.brand}, ${C.deep})` }}
        >
          <span className="font-heading text-[10px] font-extrabold uppercase tracking-[0.16em] text-white sm:text-[10.5px] sm:tracking-[0.18em]">
            5-DAY
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug sm:text-[14px]" style={{ color: C.ink }}>
            5-Day Recovery Challenge × 1
          </p>
          <p className="mt-0.5 text-[11px] sm:text-[11.5px]" style={{ color: C.inkMuted }}>
            Live · Physio-led · Zoom
          </p>
        </div>
        <div className="shrink-0 text-right font-heading text-[14px] font-bold sm:text-[15px]" style={{ color: C.ink }}>
          ₹{CHECKOUT_CONFIG.amountRupeesNumeric}
        </div>
      </div>

      {/* Included items */}
      <div className="mt-4 space-y-1.5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: C.inkMuted }}>
          Plus 7 instant-access bonuses
        </p>
        <ul className="space-y-1.5 text-[12px] sm:text-[12.5px]" style={{ color: C.inkSoft }}>
          {RECAP.slice(1).map((r) => (
            <li key={r.title} className="flex items-start gap-2">
              <CheckCircle weight="fill" className="mt-[3px] h-3.5 w-3.5 shrink-0" style={{ color: C.brand }} />
              <span className="flex-1 leading-snug">{r.title}</span>
              <span className="shrink-0 font-medium" style={{ color: C.inkMuted }}>
                <s>₹{r.value}</s>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="my-5 h-px" style={{ background: C.line }} />

      {appliedCoupon && (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl p-3"
          style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}
        >
          <CheckCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#059669' }} />
          <div>
            <p className="text-[12.5px] font-semibold" style={{ color: '#065F46' }}>
              Coupon <span className="font-mono uppercase">{appliedCoupon.code}</span> applied
            </p>
            <p className="text-[11px]" style={{ color: '#047857' }}>
              {appliedCoupon.discountReason} · You save ₹{discountAmount}
            </p>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2 text-[13.5px]">
        <div className="flex justify-between" style={{ color: C.inkSoft }}>
          <span>Subtotal</span>
          <span>₹{CHECKOUT_CONFIG.amountRupeesNumeric}</span>
        </div>
        <div className="flex justify-between" style={{ color: C.inkSoft }}>
          <span>Total Bonus Value</span>
          <s
            className="decoration-[2.5px] underline-offset-2"
            style={{ color: C.inkSoft, textDecorationColor: '#EF4444' }}
          >
            ₹{(VALUE_TOTAL - 2700).toLocaleString('en-IN')}
          </s>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between font-semibold" style={{ color: C.brand }}>
            <span>Discount ({appliedCoupon.code})</span>
            <span>−₹{discountAmount}</span>
          </div>
        )}
      </div>

      <div className="my-4 h-px" style={{ background: C.line }} />

      <div className="flex items-baseline justify-between gap-3">
        <span className="font-heading text-[13px] font-bold uppercase tracking-[0.12em] sm:text-[14px] sm:tracking-[0.14em]" style={{ color: C.ink }}>
          Total
        </span>
        <div className="text-right">
          <div className="font-heading text-[26px] font-extrabold leading-none sm:text-[32px]" style={{ color: C.brand }}>
            {finalRupees === 0 ? 'FREE' : `₹${finalRupees}.00`}
          </div>
          {finalRupees < CHECKOUT_CONFIG.amountRupeesNumeric && (
            <s className="text-[12px] sm:text-[12.5px]" style={{ color: C.inkMuted }}>
              ₹{CHECKOUT_CONFIG.amountRupeesNumeric}
            </s>
          )}
        </div>
      </div>

      {/* Method */}
      <div
        className="mt-5 flex items-start gap-3 rounded-2xl p-3"
        style={{ background: C.whisper, border: `1px solid ${C.line}` }}
      >
        <CreditCard weight="duotone" className="h-5 w-5 shrink-0" style={{ color: C.brand }} />
        <div className="text-[12.5px]">
          <p className="font-semibold" style={{ color: C.ink }}>
            UPI · Cards · NetBanking
          </p>
          <p className="mt-0.5" style={{ color: C.inkMuted }}>
            Pay securely via Razorpay.
          </p>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px]" style={{ color: C.inkMuted }}>
        <ShieldCheck weight="fill" className="h-3.5 w-3.5" style={{ color: C.brand }} />
        100% Money-Back Guarantee
      </p>
      </div>
    </>
  );
}

// ── Field component ──────────────────────────────────────────────────────────
function Field({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  error,
  touched,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
}: {
  id: keyof FormFields;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  touched: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'numeric';
}) {
  const hasError = touched && !!error;
  const isValid = touched && !error && value.trim().length > 0;
  return (
    <div id={`field-${id}`} className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-[13px] font-semibold" style={{ color: C.ink }}>
        {label} <span style={{ color: C.brand }}>*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={hasError}
        className="w-full rounded-2xl bg-white px-4 py-3 text-[15px] transition-colors focus:outline-none"
        style={{
          color: C.ink,
          border: `1px solid ${hasError ? '#FCA5A5' : isValid ? C.brand : C.line}`,
          boxShadow: hasError ? '0 0 0 3px #FEE2E2' : 'none',
        }}
      />
      <span
        role="alert"
        className={['mt-1 text-[11.5px] transition-opacity', hasError ? 'opacity-100' : 'opacity-0'].join(' ')}
        style={{ color: '#DC2626' }}
      >
        {error ?? ' '}
      </span>
    </div>
  );
}

// ── Phone input ──────────────────────────────────────────────────────────────
function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryChange,
  error,
  touched,
  onBlur,
}: {
  value: string;
  countryCode: string;
  onValueChange: (v: string) => void;
  onCountryChange: (code: string) => void;
  error?: string;
  touched: boolean;
  onBlur: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const hasError = touched && !!error;

  return (
    <div
      ref={wrapRef}
      className="relative flex items-stretch rounded-2xl bg-white transition-colors"
      style={{
        border: `1px solid ${hasError ? '#FCA5A5' : C.line}`,
        boxShadow: hasError ? '0 0 0 3px #FEE2E2' : 'none',
      }}
    >
      <button
        type="button"
        className="flex shrink-0 items-center gap-1 rounded-l-2xl px-2.5 py-3 text-[13px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:text-[14px]"
        style={{ color: C.ink, borderRight: `1px solid ${C.line}` }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Select country"
        aria-expanded={open}
      >
        <span aria-hidden="true">{selected.flag}</span>
        <span className="tabular-nums">{selected.dial}</span>
        <CaretDown weight="bold" className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: C.inkMuted }} />
      </button>
      <input
        ref={inputRef}
        type="tel"
        className="min-w-0 flex-1 rounded-r-2xl bg-transparent px-3 py-3 text-[15px] placeholder:opacity-60 focus:outline-none sm:px-3.5"
        style={{ color: C.ink }}
        placeholder={countryCode === 'IN' ? '9876543210' : 'Phone number'}
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ''))}
        onBlur={onBlur}
        inputMode="numeric"
        autoComplete="tel-national"
      />
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[320px] overflow-hidden rounded-2xl shadow-xl"
          style={{ background: 'white', border: `1px solid ${C.line}` }}
        >
          <div className="p-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-xl bg-white px-3 py-2 text-[13px] focus:outline-none"
              style={{ color: C.ink, border: `1px solid ${C.line}` }}
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto" role="listbox">
            {filtered.map((c) => (
              <button
                type="button"
                key={c.code}
                role="option"
                aria-selected={c.code === countryCode}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13.5px] transition-colors hover:opacity-80"
                style={{
                  background: c.code === countryCode ? C.blush : 'white',
                  color: c.code === countryCode ? C.deep : C.ink,
                  fontWeight: c.code === countryCode ? 600 : 400,
                }}
                onClick={() => {
                  onCountryChange(c.code);
                  setOpen(false);
                  setSearch('');
                  inputRef.current?.focus();
                }}
              >
                <span aria-hidden="true">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="tabular-nums" style={{ color: C.inkMuted }}>{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-[13px]" style={{ color: C.inkMuted }}>
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coupon section ───────────────────────────────────────────────────────────
function CouponSection({
  appliedCoupon,
  couponOpen,
  couponInput,
  couponLoading,
  couponError,
  onOpen,
  onInputChange,
  onApply,
  onRemove,
}: {
  appliedCoupon: CouponSuccess | null;
  couponOpen: boolean;
  couponInput: string;
  couponLoading: boolean;
  couponError: string | null;
  onOpen: () => void;
  onInputChange: (v: string) => void;
  onApply: () => void | Promise<void>;
  onRemove: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: C.whisper, border: `1px solid ${C.line}` }}
    >
      {!appliedCoupon ? (
        !couponOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-start gap-2 text-left text-[13px] font-semibold leading-snug transition-colors hover:opacity-80 sm:items-center sm:text-[13.5px]"
            style={{ color: C.brand }}
          >
            <Tag weight="fill" className="mt-[2px] h-4 w-4 shrink-0 sm:mt-0" />
            <span className="min-w-0 flex-1">Have a coupon? Click here to enter your code</span>
          </button>
        ) : (
          <div>
            <label htmlFor="coupon" className="mb-1.5 block text-[13px] font-semibold" style={{ color: C.ink }}>
              Coupon code
            </label>
            <div className="flex w-full gap-2">
              <input
                id="coupon"
                type="text"
                value={couponInput}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void onApply();
                  }
                }}
                placeholder="Enter code"
                aria-invalid={!!couponError}
                className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-[14.5px] uppercase tracking-wider focus:outline-none placeholder:normal-case placeholder:opacity-60"
                style={{
                  color: C.ink,
                  border: `1px solid ${couponError ? '#FCA5A5' : C.line}`,
                  boxShadow: couponError ? '0 0 0 3px #FEE2E2' : 'none',
                }}
              />
              <button
                type="button"
                onClick={onApply}
                disabled={couponLoading || !couponInput.trim()}
                className="shrink-0 rounded-2xl px-4 py-3 text-[13px] font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                style={{ background: C.black }}
              >
                {couponLoading ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="mt-2 text-[11.5px] font-medium" role="alert" style={{ color: '#DC2626' }}>
                {couponError}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#059669' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                <span className="font-mono uppercase">{appliedCoupon.code}</span> applied
              </p>
              <p className="text-[11.5px]" style={{ color: C.inkSoft }}>
                New price:{' '}
                <strong style={{ color: C.ink }}>
                  {appliedCoupon.finalAmountRupeesNumeric === 0
                    ? 'FREE'
                    : `₹${appliedCoupon.finalAmountRupeesNumeric}`}
                </strong>{' '}
                ({appliedCoupon.discountReason})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-[11.5px] font-semibold underline-offset-2 transition-colors hover:underline"
            style={{ color: C.inkSoft }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ── Payment method strip ─────────────────────────────────────────────────────
function PaymentMethods() {
  return (
    <div
      className="mt-6 rounded-2xl p-4"
      style={{ background: C.whisper, border: `1px solid ${C.line}` }}
    >
      <p
        className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.16em]"
        style={{ color: C.inkMuted }}
      >
        100% Secure &amp; Safe Payments
      </p>
      <PaymentLogos size="full" />
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Footer strip ─────────────────────────────────────────────────────────────
function FooterStrip() {
  return (
    <footer style={{ background: 'white', borderTop: `1px solid ${C.line}` }}>
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px]" style={{ color: C.inkMuted }}>
          <span>© 2026 TrainerGoesOnline. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>·</span>
            <a href="#" className="hover:underline">Terms and Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Suppress unused import (Lightning kept for future use without breaking lint).
void Lightning;
