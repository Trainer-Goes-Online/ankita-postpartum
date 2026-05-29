'use client';

/**
 * /thank-you — Thank-you page for the 5-Day Postpartum Recovery Challenge funnel.
 * Self-contained: no navbar, inline palette, focused on a single conversion —
 * getting the buyer into the WhatsApp community so they actually show up.
 *
 * The WhatsApp invite URL is a placeholder ("#"); swap WHATSAPP_INVITE to the
 * real chat invite once the human provides it.
 */

import { LazyMotion, domAnimation, m, type Variants } from 'framer-motion';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import {
  CheckCircle,
  WhatsappLogo,
  CalendarBlank,
  Clock,
  Warning,
  ShieldCheck,
  Confetti,
  Megaphone,
  X,
  Check,
  Person,
  Notebook,
  ChatCircleDots,
  Heart,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';

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
  whatsapp: '#25D366',
  whatsappDeep: '#128C7E',
  goodGreen: '#059669',
  warnAmber: '#D97706',
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

// Sourced from NEXT_PUBLIC_WHATSAPP_INVITE_URL via checkout-config.
const WHATSAPP_INVITE = CHECKOUT_CONFIG.whatsappInviteUrl;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <LazyMotion features={domAnimation}>
    <main style={{ background: C.cream, color: C.ink }} className="min-h-screen overflow-x-hidden font-body">
      <MinimalHeader />
      <Hero />
      <CommunityCTA />
      <InsideTheCommunity />
      <BeforeCall />
      <ImportantPolicy />
      <PrepChecklist />
      <FinalNudge />
      {/* Global footer renders from app/layout.tsx */}
      <MobileStickyCTA />
    </main>
    </LazyMotion>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function MinimalHeader() {
  return (
    <header style={{ background: 'white', borderBottom: `1px solid ${C.line}` }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <div className="font-heading text-[18px] font-extrabold tracking-tight" style={{ color: C.brand }}>
          BODYWORX
        </div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em]"
          style={{ background: '#ECFDF5', color: C.goodGreen, border: '1px solid #A7F3D0' }}
        >
          <CheckCircle weight="fill" className="h-3 w-3" />
          Order Confirmed
        </div>
      </div>
    </header>
  );
}

// ── Hero — "Congrats" + confirmed details ────────────────────────────────────
function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-12 pb-14 md:pt-20 md:pb-20">
      {/* Soft background bloom */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.blush}, transparent 65%)` }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <m.div variants={stagger} initial="hidden" animate="show">
          <m.div variants={scaleIn} className="mx-auto grid h-20 w-20 place-items-center rounded-full"
            style={{ background: 'white', border: `1px solid ${C.line}`, boxShadow: '0 18px 50px -16px rgba(199,58,87,0.35)' }}>
            <Confetti weight="duotone" className="h-10 w-10" style={{ color: C.brand }} />
          </m.div>

          <m.span
            variants={fadeUpSm}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: '#ECFDF5', color: C.goodGreen, border: '1px solid #A7F3D0' }}
          >
            <Check weight="bold" className="h-3 w-3" />
            Congrats!
          </m.span>

          <m.h1
            variants={fadeUp}
            className="mt-5 font-heading text-[30px] font-extrabold leading-[1.05] tracking-tight sm:text-[44px] lg:text-[52px]"
            style={{ color: C.ink }}
          >
            Your 5-Day Postpartum Reset is{' '}
            <span style={{ color: C.brand }}>Confirmed.</span>
          </m.h1>
          <m.p
            variants={fadeUp}
            className="mt-4 text-[15px] leading-relaxed sm:text-[17px]"
            style={{ color: C.inkSoft }}
          >
            You are officially enrolled in the 5-Day{' '}
            <strong style={{ color: C.ink }}>BodyWorx Postpartum Recovery Challenge.</strong> Please read this page
            carefully — your access depends on the next step.
          </m.p>

          {/* Confirmed details */}
          <m.div
            variants={fadeUp}
            className="mx-auto mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <DetailCard
              icon={CalendarBlank}
              label="Challenge Date"
              value={CHECKOUT_CONFIG.webinarDate}
            />
            <DetailCard
              icon={Clock}
              label="Live Session Timings"
              value={CHECKOUT_CONFIG.webinarTimes}
              footnote="Choose the batch that fits"
            />
          </m.div>
        </m.div>
      </div>
    </section>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  footnote,
}: {
  icon: typeof CheckCircle;
  label: string;
  value: string;
  footnote?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 text-left"
      style={{ background: 'white', border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: C.blush }}>
          <Icon weight="duotone" className="h-5 w-5" style={{ color: C.brand }} />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: C.inkMuted }}>
            {label}
          </p>
          <p className="mt-0.5 font-heading text-[14px] font-bold leading-snug" style={{ color: C.ink }}>
            {value}
          </p>
        </div>
      </div>
      {footnote && (
        <p className="mt-2 text-[11.5px]" style={{ color: C.inkMuted }}>
          {footnote}
        </p>
      )}
    </div>
  );
}

// ── Community CTA (the only thing that matters on this page) ─────────────────
function CommunityCTA() {
  return (
    <section className="px-5 pb-4 md:px-8">
      <m.div
        variants={scaleIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-8 text-center text-white md:p-10"
        style={{ background: `linear-gradient(135deg, ${C.whatsappDeep}, ${C.whatsapp})` }}
      >
        {/* WhatsApp pattern overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 22px)',
          }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] backdrop-blur">
            <Warning weight="fill" className="h-3 w-3" />
            Important · Step 1 of 1
          </span>
          <h2 className="mt-4 font-heading text-[24px] font-extrabold leading-tight sm:text-[34px]">
            Join the WhatsApp Community now.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/90">
            All updates, Zoom links, reminders, and daily instructions will be shared inside the WhatsApp Community.{' '}
            <strong className="text-white">Your access to the challenge depends on joining this group.</strong>
          </p>

          <a
            href={WHATSAPP_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-7 inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-heading text-[15px] font-bold shadow-xl transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:text-[16px]"
            style={{ color: C.whatsappDeep }}
          >
            <WhatsappLogo weight="fill" className="h-5 w-5" />
            Join the Community Here
            <ArrowRight weight="bold" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>

          <p className="mt-4 text-[11.5px] text-white/80">Opens in WhatsApp · 1-click join</p>
        </div>
      </m.div>
    </section>
  );
}

// ── Inside the Community ─────────────────────────────────────────────────────
const COMMUNITY_BENEFITS: { icon: typeof CheckCircle; text: string }[] = [
  { icon: ChatCircleDots, text: 'Daily Zoom session links' },
  { icon: Megaphone, text: 'Session reminders before class' },
  { icon: Notebook, text: 'Recovery instructions for each day' },
  { icon: Heart, text: 'Support during the 5-day reset' },
  { icon: Person, text: 'Important updates from Dr. Ankita' },
];

function InsideTheCommunity() {
  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-3xl">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center">
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="What you'll receive inside" />
          </m.div>
          <m.h2 variants={fadeUp} className="mt-3 font-heading text-[24px] font-extrabold leading-tight sm:text-[32px]" style={{ color: C.ink }}>
            What you&apos;ll receive in the <span style={{ color: C.brand }}>community.</span>
          </m.h2>
        </m.div>

        <m.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 space-y-3"
        >
          {COMMUNITY_BENEFITS.map(({ icon: Icon, text }) => (
            <m.li
              key={text}
              variants={fadeUpSm}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: 'white', border: `1px solid ${C.line}` }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: C.blush }}>
                <Icon weight="duotone" className="h-5 w-5" style={{ color: C.brand }} />
              </span>
              <span className="text-[14.5px] font-medium" style={{ color: C.inkSoft }}>
                {text}
              </span>
              <CheckCircle weight="fill" className="ml-auto h-5 w-5 shrink-0" style={{ color: C.goodGreen }} />
            </m.li>
          ))}
        </m.ul>

        <m.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-6 rounded-xl p-4 text-center text-[13.5px] font-medium"
          style={{ background: '#FEF3C7', color: C.warnAmber, border: '1px solid #FDE68A' }}
        >
          <Warning weight="fill" className="mr-1.5 inline-block h-4 w-4 align-text-bottom" />
          Please do <strong>not mute</strong> or <strong>exit the community</strong> during these <strong>5 days</strong>.
        </m.p>
      </div>
    </section>
  );
}

// ── Be available 5 min before each call ──────────────────────────────────────
function BeforeCall() {
  return (
    <section className="px-5 pb-4 md:px-8">
      <m.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mx-auto max-w-3xl rounded-3xl p-7 md:p-9"
        style={{ background: C.whisper, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: 'white', border: `1px solid ${C.line}` }}>
            <Clock weight="duotone" className="h-6 w-6" style={{ color: C.brand }} />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-[18px] font-bold leading-snug sm:text-[20px]" style={{ color: C.ink }}>
              Please be available <span style={{ color: C.brand }}>5 minutes before</span> each live session.
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              These are <strong>live physiotherapist-led sessions</strong>. Arriving late may result in missing
              important instructions.
            </p>
          </div>
        </div>
      </m.div>
    </section>
  );
}

// ── Important Policy ─────────────────────────────────────────────────────────
const POLICY_ITEMS = [
  'No rescheduling to future batches',
  'No refunds for missed live sessions',
  'Recordings are not guaranteed',
];

function ImportantPolicy() {
  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-3xl">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center">
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Please note" />
          </m.div>
          <m.h2 variants={fadeUp} className="mt-3 font-heading text-[24px] font-extrabold leading-tight sm:text-[32px]" style={{ color: C.ink }}>
            Important <span style={{ color: C.brand }}>policy.</span>
          </m.h2>
          <m.p variants={fadeUp} className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
            Because this is a live, structured recovery experience:
          </m.p>
        </m.div>

        <m.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {POLICY_ITEMS.map((item) => (
            <m.li
              key={item}
              variants={fadeUpSm}
              className="flex items-start gap-3 rounded-2xl p-5 text-center"
              style={{ background: 'white', border: `1px solid ${C.line}` }}
            >
              <X weight="bold" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.brand }} />
              <span className="text-[13.5px] font-semibold leading-snug" style={{ color: C.inkSoft }}>
                {item}
              </span>
            </m.li>
          ))}
        </m.ul>

        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mt-8 rounded-2xl p-5 text-center"
          style={{ background: C.whisper, border: `1px solid ${C.line}` }}
        >
          <p className="font-heading text-[15px] font-bold" style={{ color: C.ink }}>
            Your spot has been reserved exclusively for you.
          </p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkMuted }}>
            (Refund policy applies only after completing the full 5-day challenge as instructed.)
          </p>
        </m.div>
      </div>
    </section>
  );
}

// ── Prep checklist ───────────────────────────────────────────────────────────
const PREP_ITEMS = [
  'Wear comfortable clothes for movement',
  'Keep a yoga mat or soft surface ready',
  'Be in a distraction-free space',
  'Join the community immediately',
];

function PrepChecklist() {
  return (
    <section className="px-5 pb-16 md:px-8 md:pb-20">
      <div className="mx-auto max-w-3xl">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center">
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Quick prep" />
          </m.div>
          <m.h2 variants={fadeUp} className="mt-3 font-heading text-[24px] font-extrabold leading-tight sm:text-[32px]" style={{ color: C.ink }}>
            What to do <span style={{ color: C.brand }}>before the call.</span>
          </m.h2>
          <m.p variants={fadeUp} className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
            To get maximum results, please:
          </m.p>
        </m.div>

        <m.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {PREP_ITEMS.map((item, i) => (
            <m.li
              key={item}
              variants={fadeUpSm}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: 'white', border: `1px solid ${C.line}` }}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-heading text-[11.5px] font-extrabold text-white"
                style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.deep})` }}
              >
                {i + 1}
              </span>
              <span className="text-[14px] font-medium leading-snug" style={{ color: C.inkSoft }}>
                {item}
              </span>
            </m.li>
          ))}
        </m.ul>

        <m.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-6 text-center text-[13.5px]"
          style={{ color: C.inkMuted }}
        >
          <ShieldCheck weight="fill" className="mr-1.5 inline-block h-4 w-4 align-text-bottom" style={{ color: C.brand }} />
          <strong style={{ color: C.ink }}>No equipment required.</strong> No prior fitness level required.
        </m.p>
      </div>
    </section>
  );
}

// ── Final nudge ──────────────────────────────────────────────────────────────
function FinalNudge() {
  return (
    <section className="relative isolate overflow-hidden px-5 py-16 md:px-8 md:py-20" style={{ background: C.black }}>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-25"
        style={{ background: `radial-gradient(ellipse at top, ${C.brand} 0%, transparent 60%)` }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
          <m.h2 variants={fadeUp} className="font-heading text-[26px] font-extrabold leading-tight text-white sm:text-[36px]">
            This is your <span style={{ color: C.bright }}>first step</span><br className="hidden sm:block" />{' '}
            toward structured, safe postpartum recovery.
          </m.h2>
          <m.p variants={fadeUp} className="mt-4 text-[14.5px] text-white/75">
            Now, join the community and we&apos;ll see you inside.
          </m.p>

          <m.div variants={fadeUp} className="mt-8">
            <a
              href={WHATSAPP_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-heading text-[15px] font-bold shadow-2xl transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:text-[16px]"
              style={{ color: C.whatsappDeep }}
            >
              <WhatsappLogo weight="fill" className="h-5 w-5" />
              Join the Community
              <ArrowRight weight="bold" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: 'white', borderTop: `1px solid ${C.line}` }}>
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <p className="text-center text-[12px] font-semibold" style={{ color: C.inkSoft }}>
          © 2026 <strong>TrainerGoesOnline</strong>. All rights reserved.
        </p>
        <p className="mt-5 text-[11.5px] leading-relaxed" style={{ color: C.inkMuted }}>
          <strong>TrainerGoesOnline</strong> cannot and does not make any guarantees about your ability to get results
          or earn any money with our ideas, information, tools, or strategies. Nothing on this page, any of our
          websites, or any of our content or curriculum is a promise or guarantee of results or future earnings, and
          we do not offer any legal, medical, tax or other professional advice. Any financial numbers referenced here,
          or on any of our sites, are illustrative of concepts only and should not be considered average earnings,
          exact earnings, or promises for actual or future performance. Use caution and always consult your
          accountant, lawyer or professional advisor before acting on this or any information related to a lifestyle
          change or your business or finances. You alone are responsible and accountable for your decisions, actions
          and results in life, and by your registration here you agree not to attempt to hold us liable for your
          decisions, actions or results, at any time, under any circumstance. This site is not a part of the Meta
          website or Meta Inc. Additionally, this site is NOT endorsed by Meta in any way. FACEBOOK is a trademark of
          Meta, Inc.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-[12px]" style={{ color: C.inkMuted }}>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms and Conditions</a>
        </div>
      </div>
    </footer>
  );
}

// ── Mobile sticky CTA — anchors the page on a single action ──────────────────
function MobileStickyCTA() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="border-t px-4 pt-3 pb-3 shadow-[0_-8px_24px_-12px_rgba(199,58,87,0.25)] backdrop-blur"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: C.line }}
      >
        <a
          href={WHATSAPP_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl py-3.5 font-heading text-[14.5px] font-bold text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${C.whatsappDeep}, ${C.whatsapp})` }}
        >
          <WhatsappLogo weight="fill" className="h-5 w-5" />
          Join the WhatsApp Community
          <ArrowRight weight="bold" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────
function SectionEyebrow({ text }: { text: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ background: C.blush, color: C.deep }}
    >
      <span className="inline-block h-1 w-1 rounded-full" style={{ background: C.brand }} />
      {text}
    </span>
  );
}

