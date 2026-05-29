/**
 * Above-the-fold hero + urgency strip — a pure Server Component (no
 * 'use client', no framer-motion, no hooks). It renders entirely on the
 * server so the LCP mockup image paints from static HTML with zero
 * JavaScript on the critical path. Below-the-fold animated sections live in
 * ./below-fold and are hydrated from a separate, deferred chunk.
 *
 * Markup, copy, classes and images are byte-identical to the previous inline
 * hero — only the (already no-op) entrance motion wrappers were dropped.
 */
import Link from 'next/link';
import Image from 'next/image';
import {
  Lightning,
  Flame,
  ShieldCheck,
  CalendarBlank,
  Star,
  Sparkle,
  ArrowRight,
  Lock,
  Wind,
} from '@phosphor-icons/react/dist/ssr';
import PaymentLogos from '@/components/PaymentLogos';
import Icon3D from '@/components/Icon3D';
import { C, PRICE, LIST, WEBINAR_DATE, WEBINAR_TIMES, PrimaryCTA } from './shared';

// ── 1. Urgency Strip — DARK marquee (matches `/`) ────────────────────────────
export function UrgencyStrip() {
  return (
    <div
      style={{ background: C.deep }}
      className="relative w-full overflow-hidden text-white"
    >
      {/* Edge fades so the loop seam never reads as a hard cut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-20"
        style={{ background: `linear-gradient(to right, ${C.deep}, transparent)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-20"
        style={{ background: `linear-gradient(to left, ${C.deep}, transparent)` }}
      />

      <div
        className="bw-marquee-track py-2.5 text-[12.5px] font-medium leading-tight sm:py-3 sm:text-[13.5px]"
        role="marquee"
        aria-label="Special offer and price-increase notice"
      >
        <MarqueeGroup />
        <MarqueeGroup ariaHidden />
      </div>
    </div>
  );
}

function MarqueeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-8 px-4 sm:gap-12 sm:px-8"
    >
      <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
        <Lightning weight="fill" className="h-3.5 w-3.5" style={{ color: C.bright }} />
        <span>
          <strong className="font-semibold">Special Offer:</strong>{' '}
          5-Day Postpartum Recovery Challenge for ₹{PRICE}
        </span>
      </span>
      <MarqueeDot />
      <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
        <Flame weight="fill" className="h-3.5 w-3.5" style={{ color: C.bright }} />
        <span>Price increases to <s className="opacity-70">₹{LIST}</s> tomorrow</span>
      </span>
      <MarqueeDot />
      <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
        <ShieldCheck weight="fill" className="h-3.5 w-3.5" style={{ color: C.bright }} />
        <span>100% Money-Back Guarantee</span>
      </span>
      <MarqueeDot />
      <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
        <CalendarBlank weight="fill" className="h-3.5 w-3.5" style={{ color: C.bright }} />
        <span>Live · Starts {WEBINAR_DATE} · {WEBINAR_TIMES}</span>
      </span>
      <MarqueeDot />
    </div>
  );
}

function MarqueeDot() {
  return (
    <span
      aria-hidden
      className="block h-1 w-1 shrink-0 rounded-full bg-white/40"
    />
  );
}

// ── 2. Hero — services.ikorepilates.com style ────────────────────────────────
export function Hero() {
  return (
    <section className="relative isolate pt-10 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-32">
      {/* Soft ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 -left-40 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.blush}, transparent 65%)` }}
        />
        <div
          className="absolute top-20 right-[-12rem] h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.whisper}, transparent 70%)` }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* LEFT: copy. Static markup so the mobile LCP mockup image paints
            with the server HTML instead of waiting on client hydration. */}
        <div className="relative text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
              style={{ background: C.blush, color: C.deep }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: C.brand }} />
              For Postpartum Moms · 5-Day Reset
            </span>
          </div>

          <h1
            className="mt-5 font-heading text-[34px] font-extrabold leading-[1.04] tracking-tight sm:text-[44px] lg:text-[56px]"
            style={{ color: C.ink }}
          >
            Reduce your <span style={{ color: C.brand }}>&ldquo;Mummy Belly&rdquo;</span> &amp; DR{' '}
            <span className="whitespace-nowrap">
              by <span style={{ color: C.brand }}>10–20%</span>
            </span>{' '}
            in just{' '}
            <span className="italic" style={{ color: C.deep }}>
              5 days.
            </span>
          </h1>

          {/* Mobile-only product mockup — sits below the h1, hidden on lg+ */}
          <div className="mt-6 flex justify-center lg:hidden">
            <Image
              src="/transformations/Mockup.png"
              alt="BodyWorx Postpartum Recovery Method mockup"
              width={920}
              height={620}
              priority
              sizes="(max-width: 768px) 90vw, 460px"
              className="h-auto w-full max-w-[460px] select-none"
              draggable={false}
            />
          </div>

          <p
            className="mt-5 max-w-[640px] text-[15px] leading-relaxed sm:text-[16px] lg:mx-0 mx-auto"
            style={{ color: C.inkSoft }}
          >
            A doctor-led postpartum recovery challenge to reduce mummy belly &amp; DR, improve core stability,
            and restore confidence in daily movement. Starts <strong>{WEBINAR_DATE}</strong> — live on Zoom.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:items-center lg:justify-start">
            <PrimaryCTA href="/checkout" label={`Start Your 5-Day Reset · ₹${PRICE}`} />
            <div className="flex items-center justify-center gap-2 text-[13px]" style={{ color: C.inkMuted }}>
              <ShieldCheck weight="fill" className="h-4 w-4" style={{ color: C.brand }} />
              100% Money-Back Guarantee
            </div>
          </div>

          <div
            className="mt-7 flex flex-wrap justify-center gap-2 text-[12.5px] sm:gap-2.5 lg:justify-start"
            style={{ color: C.inkSoft }}
          >
            <HeroChip icon3d="calendar" text={`Starts ${WEBINAR_DATE}`} />
            <HeroChip icon3d="clock" text={WEBINAR_TIMES} />
            <HeroChip icon={Star} text="Rated 4.9 / 5" />
          </div>
        </div>

        {/* RIGHT: offer card + product mockup */}
        <div className="relative">
          <HeroOfferCard />
        </div>
      </div>
    </section>
  );
}

type HeroChipProps = { icon?: typeof Wind; icon3d?: string; text: string };

function HeroChip({ icon: Icon, icon3d, text }: HeroChipProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-medium"
      style={{ background: 'white', border: `1px solid ${C.line}` }}
    >
      {icon3d ? (
        <Icon3D name={icon3d} size={16} className="shrink-0" />
      ) : Icon ? (
        <Icon weight="duotone" className="h-3.5 w-3.5 shrink-0" style={{ color: C.brand }} />
      ) : null}
      <span>{text}</span>
    </div>
  );
}

function HeroOfferCard() {
  return (
    <div className="relative">
      {/* Halo */}
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[36px] opacity-70 blur-2xl"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${C.blush}, transparent 70%)` }}
      />

      <div
        className="relative overflow-hidden rounded-[28px] shadow-[0_30px_80px_-30px_rgba(199,58,87,0.35)]"
        style={{ background: 'white', border: `1px solid ${C.line}` }}
      >
        {/* Discount ribbon */}
        <div
          className="absolute top-5 right-5 z-10 rotate-6 rounded-2xl px-3 py-2 text-center text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.deep})` }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">Today Only</div>
          <div className="font-heading text-2xl font-extrabold leading-none">70% OFF</div>
        </div>

        {/* Product mockup graphic (laptop + phone composition) */}
        <div className="relative px-6 pt-7 pb-4" style={{ background: `linear-gradient(180deg, ${C.whisper}, white)` }}>
          <ProductMockup />
        </div>

        {/* Offer details */}
        <div className="px-6 py-6">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ background: C.blush, color: C.deep }}
          >
            <Sparkle weight="fill" className="h-3 w-3" />
            BodyWorx Recovery Method™
          </div>

          <h3 className="mt-3 font-heading text-[22px] font-bold leading-tight" style={{ color: C.ink }}>
            5-Day Postpartum Recovery Challenge
          </h3>
          <p className="mt-1.5 text-[13.5px]" style={{ color: C.inkMuted }}>
            Live physio-led · Zoom · 3 batch timings
          </p>

          {/* Price row */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-heading text-[40px] font-extrabold leading-none" style={{ color: C.brand }}>
              ₹{PRICE}
            </span>
            <span className="text-[15px] line-through" style={{ color: C.inkMuted }}>
              ₹{LIST}
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-[10.5px] font-bold"
              style={{ background: C.blush, color: C.deep }}
            >
              SAVE ₹{LIST - PRICE}
            </span>
          </div>

          <Link
            href="/checkout"
            className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform duration-200"
            style={{ background: `linear-gradient(180deg, ${C.brand}, ${C.deep})` }}
          >
            Reserve My Spot
            <ArrowRight weight="bold" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] font-medium" style={{ color: C.inkMuted }}>
            <Lock weight="fill" className="h-3 w-3" />
            100% Secure · UPI / Card / NetBanking
          </div>

          {/* Premium payment-method logos */}
          <div className="mt-3">
            <PaymentLogos size="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Real product mockup image — replaces the CSS-drawn laptop placeholder. */
function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <Image
        src="/transformations/ankitamockup-1.png"
        alt="BodyWorx Recovery Method app mockup"
        width={920}
        height={620}
        priority
        sizes="(max-width: 768px) 90vw, 460px"
        className="h-auto w-full select-none"
        draggable={false}
      />
    </div>
  );
}
