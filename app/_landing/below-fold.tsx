'use client';

/**
 * / — 5-Day Postpartum 'Flat Belly' Challenge landing page.
 *
 * Self-contained: no navbar, inline palette (so the existing pink prenatal
 * site at `/` is unaffected), Framer Motion scroll-triggered reveals, Phosphor
 * icons, all CTAs route to /checkout. Price reads from CHECKOUT_CONFIG so
 * the env var NEXT_PUBLIC_OFFER_PRICE_RUPEES still controls what users pay.
 */

import Link from 'next/link';
import Image from 'next/image';
import { LazyMotion, domAnimation, m, useReducedMotion, type Variants } from './motion-lite';
import { useEffect, useRef, useState } from 'react';
import {
  Wind,
  HouseLine,
  HandHeart,
  PersonSimpleRun,
  Baby,
  ChalkboardTeacher,
  Drop,
  Bandaids,
  Flame,
  Lightning,
  Heart,
  Brain,
  BowlFood,
  Scales,
  ShieldCheck,
  Star,
  Sparkle,
  CheckCircle,
  ArrowRight,
  Clock,
  CalendarBlank,
  Lock,
  Confetti,
  WarningCircle,
  Trophy,
  ChatCircleDots,
  X,
  Check,
  Pulse,
  Tag,
} from '@phosphor-icons/react/dist/ssr';
import PaymentLogos from '@/components/PaymentLogos';
import VideoLightbox from '@/components/VideoLightbox';
import Icon3D from '@/components/Icon3D';
import CountUp from '@/components/CountUp';
import StickyCTA from '@/components/StickyCTA';
import { VIDEO_TESTIMONIALS, VIDEO_TESTIMONIALS_2, IMAGE_TESTIMONIALS } from '@/lib/testimonials';
import {
  C,
  PRICE,
  LIST,
  VALUE_TOTAL,
  WEBINAR_DATE,
  WEBINAR_TIMES,
  SectionEyebrow,
  PrimaryCTA,
} from './shared';


// Exponential ease-out (Impeccable UI motion spec — no springs).
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Animation primitives ─────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const slideRight: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};
const slideLeft: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};


/**
 * Arms (returns true) once the referenced element comes within `rootMargin` of
 * the viewport. Used to eager-load marquee images just before the user reaches
 * them — the marquee scrolls horizontally, so per-image lazy loading would
 * otherwise leave tiles blank until each one animates into view.
 */
function useArmNear<T extends Element>(rootMargin = '1200px') {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (armed) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed, rootMargin]);
  return { ref, armed };
}

/**
 * Scroll-linked progress fill for the 5-day timeline.
 *
 * motion-lite ships no-op `useScroll`/`useTransform` stubs — that's the whole
 * point of it (zero framer-motion JS below the fold), which left the timeline's
 * progress line permanently full. This is the replacement driver: it maps the
 * section's position to a 0→1 scaleY and writes it straight to the node inside
 * a rAF, so scrolling never triggers a React render.
 *
 * Progress mirrors the original framer offset ['start 70%', 'end 30%']:
 * 0 when the section top crosses 70% of the viewport, 1 when its bottom
 * crosses 30%. Reduced-motion users get the line filled outright.
 */
function useTimelineProgress<S extends HTMLElement, F extends HTMLElement>() {
  const sectionRef = useRef<S>(null);
  const fillRef = useRef<F>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const fill = fillRef.current;
    if (!section || !fill) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fill.style.transform = 'scaleY(1)';
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.7; // top of section at 70% viewport height → 0
      const end = vh * 0.3; // bottom of section at 30% viewport height → 1
      const span = rect.height + start - end || 1;
      const p = (start - rect.top) / span;
      fill.style.transform = `scaleY(${Math.min(1, Math.max(0, p))})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { sectionRef, fillRef };
}

// ── Below-the-fold sections ──────────────────────────────────────────────────
// Everything after the hero. Rendered server-side (ssr) but hydrated from a
// deferred client chunk so Framer Motion stays off the critical path.
export default function BelowFold() {
  return (
    <LazyMotion features={domAnimation}>
      <TrustStrip />
      <Experience />
      <FiveDaySchedule />
      <BatchTimingsCTA />
      <DoesThisSoundLikeYou />
      <Testimonials />
      <Transformations />
      <ValueIntro />
      <ValueStack />
      <Founder />
      <Stats />
      <Promise />
      <Method />
      <MomsNotice />
      <LetsBeHonest />
      <Recap />
      <FinalStrip />
      {/* Global footer lives in app/layout.tsx and renders automatically. */}
      <StickyCTA />
    </LazyMotion>
  );
}


function DiagnosisRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-1 w-1 rounded-full" style={{ background: C.brand }} />
      {label}
    </div>
  );
}

// ── 3. Trust strip ───────────────────────────────────────────────────────────
function TrustStrip() {
  return (
    <section className="relative py-8" style={{ background: 'white', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {[
            { icon3d: 'star', top: '4.9 / 5', sub: 'Women 28–45' },
            { icon3d: 'heart', top: '4,000+', sub: 'Moms recovered' },
            { icon3d: 'shield', top: '100%', sub: 'Money-back' },
            { icon3d: 'locked', top: 'Secure', sub: 'UPI · Cards · NB' },
          ].map(({ icon3d, top, sub }) => (
            <m.div key={top} variants={fadeUpSm} className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                style={{ background: C.blush }}
              >
                {icon3d === 'star' ? (
                  <Star weight="fill" className="h-5 w-5" style={{ color: C.brand }} />
                ) : (
                  <Icon3D name={icon3d} size={26} />
                )}
              </span>
              <div>
                <div className="font-heading text-[15px] font-bold" style={{ color: C.ink }}>
                  {top}
                </div>
                <div className="text-[12px]" style={{ color: C.inkMuted }}>
                  {sub}
                </div>
              </div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}

// ── 4. What You'll Experience (6 features) ───────────────────────────────────
const FEATURES: { icon: typeof Wind; title: string; body: string }[] = [
  {
    icon: ChalkboardTeacher,
    title: 'Live Physio-Led Recovery Sessions',
    body: 'Every day live on Zoom with Dr. Ankita and team. No random workouts, no pre-recorded confusion — just guided, real-time recovery support.',
  },
  {
    icon: HouseLine,
    title: 'Safe, Home-Based Movements',
    body: 'No equipment. No gym. Gentle, corrective movements designed specifically for DR, mummy pouch, leaks, and weak core.',
  },
  {
    icon: Wind,
    title: 'Core & Pelvic Floor Reconnection',
    body: 'Learn how to activate, breathe, and control pressure step-by-step so your belly, hernia risk, and leakage don’t worsen.',
  },
  {
    icon: PersonSimpleRun,
    title: 'Posture & Daily Movement Corrections',
    body: 'Fix the small daily habits (feeding, lifting, sitting) that increase internal pressure and delay healing.',
  },
  {
    icon: Baby,
    title: 'Recovery for Real Mom Life',
    body: 'Feel stronger, more stable, and more energetic with recovery habits that combine corrective movement and simple postpartum nutrition for everyday life.',
  },
  {
    icon: HandHeart,
    title: 'Live Guidance & Form Corrections',
    body: 'Clear instructions, real-time feedback, and adjustments so you’re not just moving — you’re healing safely and correctly.',
  },
  {
    icon: BowlFood,
    title: 'Postpartum Nutrition That Supports Healing',
    body: 'Simple, practical nutrition guidance to reduce bloating, support tissue healing, improve energy, and fuel recovery without crash dieting or restrictive meal plans.',
  },
];

function Experience() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl text-center"
        >
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="The Experience" />
          </m.div>
          <m.h2
            variants={fadeUp}
            className="mt-3 font-heading text-[28px] font-extrabold leading-tight sm:text-[40px]"
            style={{ color: C.ink }}
          >
            Here&apos;s what you&apos;ll experience{' '}
            <span style={{ color: C.brand }}>in 5 days.</span>
          </m.h2>
          <m.p variants={fadeUp} className="mt-4 text-[15px] sm:text-[16px]" style={{ color: C.inkSoft }}>
            A simple, live postpartum recovery reset — so you can feel the difference before committing long-term.
          </m.p>
        </m.div>

        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, body }, idx) => {
            // 7 features → both breakpoints leave a single orphan in the last
            // row (2-col: 3 rows + 1 · 3-col: 2 rows + 1). The orphan spans the
            // full row but is width-capped + centered so it reads as one normal
            // card instead of a stranded left-aligned one. Widths mirror the
            // gap-5 (20px) track math at each breakpoint.
            const isOrphan = idx === FEATURES.length - 1;
            const placement = [
              isOrphan && FEATURES.length % 2 === 1
                ? 'sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-[calc(50%-10px)]'
                : '',
              isOrphan && FEATURES.length % 3 === 1
                ? 'lg:col-span-3 lg:max-w-[calc(33.333%-13.334px)]'
                : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
            <m.article
              key={title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={`relative overflow-hidden rounded-2xl p-7 ${placement}`}
              style={{ background: 'white', border: `1px solid ${C.line}` }}
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-xl"
                style={{ background: C.blush }}
              >
                <Icon weight="duotone" className="h-6 w-6" style={{ color: C.brand }} />
              </span>
              <h3 className="mt-4 font-heading text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
                {title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                {body}
              </p>
            </m.article>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}

// ── 5. The Animated 5-Day Schedule (finishstrongproject.com style) ──────────
const DAYS: { num: number; icon: typeof Wind; title: string; body: string }[] = [
  {
    num: 1,
    icon: Wind,
    title: 'Breathing + Legs Activation',
    body: 'Breathing exercises for DR and mummy tummy + gentle leg workout to improve stability safely.',
  },
  {
    num: 2,
    icon: HandHeart,
    title: 'Mobility + Core Connection',
    body: 'Pelvic floor and hip mobility for pain relief + core & pelvic floor connection and light strengthening.',
  },
  {
    num: 3,
    icon: PersonSimpleRun,
    title: 'Yoga + Do’s & Don’ts',
    body: 'Safe yoga flow + what to do and what to avoid if you have DR or umbilical hernia.',
  },
  {
    num: 4,
    icon: Drop,
    title: 'Leak & Pain Relief Day',
    body: 'Urine leakage exercises + pain management + posture correction and easier walking mechanics.',
  },
  {
    num: 5,
    icon: Flame,
    title: 'Fat Loss + Nutrition Reset',
    body: 'Learn why postpartum fat loss isn’t about eating less. Discover simple nutrition habits that support healing, reduce bloating, improve energy, and help your body recover safely.',
  },
];

function FiveDaySchedule() {
  // Vertical progress line fill that follows scroll — see useTimelineProgress.
  const { sectionRef, fillRef } = useTimelineProgress<HTMLElement, HTMLDivElement>();

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28"
      style={{ background: `linear-gradient(180deg, white, ${C.whisper})` }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Your Schedule" />
          </m.div>
          <m.h2
            variants={fadeUp}
            className="mt-3 font-heading text-[30px] font-extrabold leading-[1.05] sm:text-[44px]"
            style={{ color: C.ink }}
          >
            Your 5-Day Schedule.
          </m.h2>
          <m.p variants={fadeUp} className="mt-4 text-[15px] sm:text-[16px]" style={{ color: C.inkSoft }}>
            Each day builds your recovery step-by-step with live physio guidance at{' '}
            <strong style={{ color: C.deep }}>{WEBINAR_TIMES}</strong>.
          </m.p>
        </m.div>

        {/* Timeline */}
        <div className="relative mt-16 md:mt-20">
          {/* Vertical track (mobile: left; desktop: center) */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-[22px] w-[2px] md:left-1/2 md:-translate-x-1/2"
            style={{ background: C.line }}
          />
          {/* Scroll-linked fill. Positioned with a calc() left rather than
              md:-translate-x-1/2 like the track above — the inline scaleY
              transform overrides that utility and would otherwise leave the
              fill sitting 1px off the track. */}
          <div
            aria-hidden
            ref={fillRef}
            style={{
              transform: 'scaleY(0)',
              transformOrigin: 'top',
              background: `linear-gradient(180deg, ${C.brand}, ${C.bright})`,
            }}
            className="absolute top-0 bottom-0 left-[22px] w-[2px] md:left-[calc(50%-1px)]"
          />

          <ol className="space-y-12 md:space-y-20">
            {DAYS.map((d, i) => (
              <DayRow key={d.num} day={d} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function DayRow({
  day,
  index,
}: {
  day: { num: number; icon: typeof Wind; title: string; body: string };
  index: number;
}) {
  const isRight = index % 2 === 1;
  const Icon = day.icon;
  return (
    <li className="relative">
      <div className="md:grid md:grid-cols-2 md:gap-12">
        {/* Card container — alternates side on desktop */}
        <m.div
          variants={isRight ? slideLeft : slideRight}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.55 }}
          className={[
            'relative pl-14 md:pl-0',
            isRight ? 'md:col-start-2 md:pl-12' : 'md:col-start-1 md:pr-12 md:text-right',
          ].join(' ')}
        >
          {/* Node — sits on the track.
              Mobile: always centered on the LEFT track at left-[22px]
              (node is 28px wide, so left-[8px] centers it visually).
              Desktop: alternates left/right of the centered track. */}
          <span
            aria-hidden
            className={[
              'absolute top-1 z-10 grid h-7 w-7 place-items-center rounded-full text-white shadow-md md:top-2',
              // Mobile: fixed left position on the left-aligned track.
              'left-[8px]',
              // Desktop: alternating offsets so the node hugs the centered track.
              isRight
                ? 'md:left-[-14px] md:right-auto'
                : 'md:left-auto md:right-[-14px]',
            ].join(' ')}
            style={{
              background: `linear-gradient(135deg, ${C.brand}, ${C.deep})`,
            }}
          >
            <span className="font-heading text-[12px] font-extrabold leading-none">{day.num}</span>
          </span>

          <div
            className="rounded-2xl p-6 md:p-7"
            style={{ background: 'white', border: `1px solid ${C.line}`, boxShadow: '0 18px 50px -28px rgba(199,58,87,0.25)' }}
          >
            <div className={['flex items-center gap-2.5', isRight ? '' : 'md:flex-row-reverse'].join(' ')}>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ background: C.blush, color: C.deep }}
              >
                <CalendarBlank weight="fill" className="h-3 w-3" />
                Day {day.num}
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: C.whisper }}
              >
                <Icon weight="duotone" className="h-5 w-5" style={{ color: C.brand }} />
              </span>
            </div>
            <h3 className="mt-3 font-heading text-[19px] font-bold leading-snug sm:text-[21px]" style={{ color: C.ink }}>
              {day.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              {day.body}
            </p>
          </div>
        </m.div>
      </div>
    </li>
  );
}

// ── 6. Batch timings + CTA ───────────────────────────────────────────────────
function BatchTimingsCTA() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="overflow-hidden rounded-3xl p-8 text-center text-white md:p-10 lg:p-12"
          style={{ background: `linear-gradient(135deg, ${C.deep}, ${C.brand})` }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            <Clock weight="fill" className="h-3.5 w-3.5" />
            Daily Live Classes
          </div>
          <h3 className="mt-4 font-heading text-[24px] font-extrabold leading-tight text-white sm:text-[30px]">
            {WEBINAR_TIMES} on Zoom.
          </h3>
          <p className="mt-2 text-[14.5px] text-white/85">Choose the batch that fits your schedule.</p>
          <div className="mt-7">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-heading text-[15px] font-bold shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
              style={{ color: C.deep }}
            >
              Get Instant Access · ₹{PRICE}
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-[11.5px] text-white/80">100% Money-Back Guarantee</p>
          </div>
        </m.div>
      </div>
    </section>
  );
}

// ── 7. Does this sound like you? ─────────────────────────────────────────────
const PAIN_POINTS = [
  {
    text: 'You tried workouts but your <em>belly, Diastasis Recti,</em> or <em>leaks</em> never improved.',
  },
  {
    text: 'Every “free challenge” gave motivation, <em>but no real healing.</em>',
  },
  {
    text: 'You’re <em>scared</em> to exercise because you don’t want to worsen DR or leakage.',
  },
  {
    text: 'Your mummy pouch doesn’t <em>change</em> no matter how hard you try.',
  },
  {
    text: 'You’re tired of guessing and want structured guidance that <em>actually makes sense.</em>',
  },
];

function DoesThisSoundLikeYou() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center"
        >
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Read carefully" />
          </m.div>
          <m.h2
            variants={fadeUp}
            className="mt-3 font-heading text-[28px] font-extrabold leading-tight sm:text-[40px]"
            style={{ color: C.ink }}
          >
            Does this sound like you?
          </m.h2>
        </m.div>

        <m.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 space-y-3"
        >
          {PAIN_POINTS.map((p, i) => (
            <m.li
              key={i}
              variants={fadeUp}
              className="flex items-start gap-3 rounded-2xl p-5"
              style={{ background: C.whisper, border: `1px solid ${C.line}` }}
            >
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
                style={{ background: 'white', border: `1px solid ${C.line}` }}
              >
                <X weight="bold" className="h-3.5 w-3.5" style={{ color: C.brand }} />
              </span>
              <p
                className="text-[15px] leading-relaxed sm:text-[16.5px]"
                style={{ color: C.inkSoft }}
                dangerouslySetInnerHTML={{
                  __html: p.text.replace(
                    /<em>(.*?)<\/em>/g,
                    `<strong style="color:${C.brand}">$1</strong>`,
                  ),
                }}
              />
            </m.li>
          ))}
        </m.ul>
      </div>
    </section>
  );
}

// ── 8. Video testimonials — continuous marquee (autoplay + infinite loop) ────
// Seconds each tile takes to travel one tile-width. Rows hold different numbers
// of videos, so the loop duration is derived per row from this — a flat 60s for
// both would make the 13-tile row scroll twice as fast as the 6-tile one.
const TESTIMONIALS_SECONDS_PER_TILE = 10;

/**
 * One infinite testimonial row. Both rows share this so playback, tile size,
 * hover and lightbox behaviour stay identical — the lower row only differs in
 * travel direction and in showing the speaker's name on the tile.
 */
function TestimonialMarquee({
  items,
  direction,
  showNames = false,
  onOpen,
}: {
  items: typeof VIDEO_TESTIMONIALS;
  direction: 'left' | 'right';
  showNames?: boolean;
  onOpen: (videoUrl: string) => void;
}) {
  const reduce = useReducedMotion();
  const { ref: marqueeRef, armed } = useArmNear<HTMLDivElement>();

  // Duplicate so the 50% translate lands exactly on the duplicate copy →
  // seamless infinite loop with no visible seam.
  const track = [...items, ...items];
  const xKeyframes = direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];
  // Scale the loop to the row's length so both rows travel at the same speed.
  const duration = items.length * TESTIMONIALS_SECONDS_PER_TILE;

  return (
    <div ref={marqueeRef} className="relative overflow-hidden">
      <m.div
        className="flex w-max gap-4"
        animate={reduce ? undefined : { x: xKeyframes }}
        transition={{
          duration,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        {track.map((v, i) => (
          <VideoTile
            key={`${v.videoUrl}-${i}`}
            poster={v.poster}
            name={showNames ? v.name : undefined}
            index={(i % items.length) + 1}
            eager={armed}
            onClick={() => onOpen(v.videoUrl)}
          />
        ))}
      </m.div>
    </div>
  );
}

function Testimonials() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24" style={{ background: C.whisper }}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center"
        >
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="In their words" />
          </m.div>
          <m.h2
            variants={fadeUp}
            className="mt-3 font-heading text-[26px] font-extrabold leading-tight sm:text-[38px]"
            style={{ color: C.ink }}
          >
            What <span style={{ color: C.brand }}>MOTHERS</span> say about the{' '}
            <span style={{ color: C.brand }}>Bodyworx Method</span>.
          </m.h2>
          <m.p variants={fadeUp} className="mt-3 text-[13.5px]" style={{ color: C.inkMuted }}>
            Tap any video to hear it in her own words.
          </m.p>
        </m.div>
      </div>

      {/* Two rows travelling opposite ways — the counter-scroll reads as a
          single wall of proof rather than two separate sliders. */}
      <div className="mt-10 flex flex-col gap-4 sm:mt-12">
        <TestimonialMarquee
          items={VIDEO_TESTIMONIALS}
          direction="left"
          onOpen={setOpenId}
        />
        <TestimonialMarquee
          items={VIDEO_TESTIMONIALS_2}
          direction="right"
          showNames
          onOpen={setOpenId}
        />
      </div>

      <VideoLightbox videoUrl={openId} onClose={() => setOpenId(null)} />
    </section>
  );
}

function VideoTile({
  poster,
  index,
  eager,
  name,
  onClick,
}: {
  poster: string;
  index: number;
  eager?: boolean;
  /** When set, the speaker's name is shown on the tile. */
  name?: string;
  onClick: () => void;
}) {
  return (
    <m.button
      data-slide
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25, ease: EASE }}
      aria-label={name ? `Play ${name}'s video testimonial` : `Play video testimonial ${index}`}
      className="group relative block aspect-[3/4] w-[200px] shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-soft transition-shadow focus-visible:outline-none focus-visible:ring-4 sm:w-[240px] lg:w-[260px]"
      style={{ border: `1px solid ${C.line}` }}
    >
      <Image
        src={poster}
        alt=""
        fill
        sizes="(min-width: 1024px) 260px, (min-width: 640px) 240px, 200px"
        loading={eager ? 'eager' : 'lazy'}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Dark gradient + play button */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span
          className="grid h-12 w-12 place-items-center rounded-full text-white shadow-lg backdrop-blur transition-transform duration-300 group-hover:scale-110"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden>
            <path d="M14 8L0 16V0L14 8Z" />
          </svg>
        </span>
      </span>

      {/* Name plate. The first row's posters ship with a brand wash and a
          centred italic display name baked into the artwork; these frames are
          raw, so the same treatment is applied in CSS to keep both rows
          reading as one set. */}
      {name && (
        <>
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(242,76,105,0.22), rgba(242,76,105,0.06) 42%, rgba(199,58,87,0.28) 100%)`,
            }}
          />
          <span
            className="absolute inset-x-0 bottom-0 px-2.5 pb-3.5 pt-10 text-center"
            style={{
              background: `linear-gradient(to top, rgba(31,16,20,0.88) 12%, rgba(31,16,20,0.42) 58%, transparent)`,
            }}
          >
            <span
              className="block truncate font-editorial text-[15px] font-bold uppercase italic leading-tight tracking-[0.06em] text-white sm:text-[17px]"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
            >
              {name}
            </span>
          </span>
        </>
      )}
    </m.button>
  );
}

// ── 9. Transformations — dual infinite marquee (no dots, no arrows) ──────────
// Renders all 34 transformation tiles split into 2 seamless infinite rows:
//   Row 1 (tiles 1–17) → scrolls right
//   Row 2 (tiles 18–34) → scrolls left
// Each row's track is duplicated so a -50% translate lands on the duplicate.
// Respects prefers-reduced-motion (halts).
const TRANSFORMATIONS_ROW_1 = IMAGE_TESTIMONIALS.slice(0, 17);
const TRANSFORMATIONS_ROW_2 = IMAGE_TESTIMONIALS.slice(17);
const TRANSFORMATIONS_DURATION = 90;

function Transformations() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="bw-wrap text-center">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Real results" />
          </m.div>
          <m.h2
            variants={fadeUp}
            className="mt-3 font-heading text-[26px] font-extrabold leading-tight sm:text-[40px]"
            style={{ color: C.ink }}
          >
            Super <span style={{ color: C.brand }}>MOMS</span>. Super Postpartum{' '}
            <span style={{ color: C.brand }}>Transformations.</span>
          </m.h2>
          <m.p variants={fadeUp} className="mt-3 text-[13.5px]" style={{ color: C.inkMuted }}>
            Unedited, real moms — names blurred for privacy.
          </m.p>
        </m.div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:gap-5">
        <TransformationMarquee images={TRANSFORMATIONS_ROW_1} direction="right" />
        <TransformationMarquee images={TRANSFORMATIONS_ROW_2} direction="left" />
      </div>
    </section>
  );
}

function TransformationMarquee({
  images,
  direction,
}: {
  images: string[];
  direction: 'left' | 'right';
}) {
  const reduce = useReducedMotion();
  const { ref: marqueeRef, armed } = useArmNear<HTMLDivElement>();
  const track = [...images, ...images];
  const xKeyframes =
    direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div ref={marqueeRef} className="relative overflow-hidden">
      {/* Edge fades so the seam never reads as a hard cut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-20"
        style={{ background: `linear-gradient(to right, ${C.cream}, transparent)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-20"
        style={{ background: `linear-gradient(to left, ${C.cream}, transparent)` }}
      />
      <m.div
        className="flex w-max gap-3 sm:gap-4"
        animate={reduce ? undefined : { x: xKeyframes }}
        transition={{
          duration: TRANSFORMATIONS_DURATION,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
        aria-hidden
      >
        {track.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative h-[200px] w-[200px] shrink-0 overflow-hidden rounded-2xl shadow-soft sm:h-[260px] sm:w-[260px] lg:h-[300px] lg:w-[300px]"
            style={{ border: `1px solid ${C.line}`, background: 'white' }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 200px, (max-width: 1024px) 260px, 300px"
              loading={armed ? 'eager' : 'lazy'}
              className="scale-[1.06] object-cover"
              draggable={false}
            />
          </div>
        ))}
      </m.div>
    </div>
  );
}

function TransformationTile({ src, index }: { src: string; index: number }) {
  return (
    <m.figure
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.5,
        ease: EASE,
        // Cap the cascade at 0.4s so the 13th-34th tiles still appear promptly.
        delay: Math.min(index * 0.03, 0.4),
      }}
      whileHover={{ y: -3 }}
      className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-soft"
      style={{ border: `1px solid ${C.line}` }}
    >
      {/* Slight scale crop masks ~3% of each edge, which hides the minor
          white-border variance in the source PNGs and gives every tile the
          same visual baseline. */}
      <Image
        src={src}
        alt={`Real client transformation ${index}`}
        fill
        sizes="(min-width: 1024px) 260px, (min-width: 640px) 320px, 45vw"
        className="scale-[1.06] object-cover"
      />
    </m.figure>
  );
}

// ── 10. Value intro ──────────────────────────────────────────────────────────
function ValueIntro() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <m.p
            variants={fadeUpSm}
            className="font-heading text-[15px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.brand }}
          >
            Get Instant Access To
          </m.p>
          <m.h2
            variants={fadeUp}
            className="mt-2 font-heading text-[28px] font-extrabold leading-tight sm:text-[40px]"
            style={{ color: C.ink }}
          >
            Your 5-Day Recovery Trial &amp;<br />
            <span style={{ color: C.brand }}>Personalized Healing &amp; Nutrition Roadmap.</span>
          </m.h2>
          <m.p variants={fadeUp} className="mt-3 text-[14.5px]" style={{ color: C.inkMuted }}>
            (Powered by the BodyWorx Postpartum Recovery Method™)
          </m.p>
        </m.div>
      </div>
    </section>
  );
}

// ── 11. Value Stack — 7 bundle items + sum to ₹10,000 ────────────────────────
const BUNDLE: { imgSrc: string; title: string; value: number; body: string }[] = [
  {
    imgSrc: '/transformations/5-day.png',
    title: '5-Day Recovery Challenge',
    value: 2700,
    body: 'Try the exact daily movements that fix mummy belly and leaks. See how it feels to have a stronger core in just one week.',
  },
  {
    imgSrc: '/transformations/dr(diastasis).png',
    title: 'DR (Diastasis Recti) Gap Check & Analysis',
    value: 900,
    body: 'Learn the "Doctor’s Way" to check your belly gap. Understand if your gap is closing or if your workouts are making it wider.',
  },
  {
    imgSrc: '/transformations/core&pelvic.png',
    title: 'Core & Pelvic Floor Readiness Check',
    value: 900,
    body: 'Know whether your core is actually ready for exercise — or why starting now could worsen symptoms.',
  },
  {
    imgSrc: '/transformations/postural.png',
    title: 'Postural & Alignment Diagnosis',
    value: 900,
    body: 'Assessment of posture, spinal alignment, and daily positions that directly affect healing and pain.',
  },
  {
    imgSrc: '/transformations/nutrition.png',
    title: 'Personalized Nutrition Review',
    value: 1100,
    body: 'Identify the food habits slowing your recovery and receive simple postpartum-safe nutrition guidance to support tissue healing, reduce bloating, improve energy, and complement your recovery exercises.',
  },
  {
    imgSrc: '/transformations/howtostart.png',
    title: '"How to Start Exercising Postpartum" Safety Guide',
    value: 900,
    body: 'When to start • What to avoid • How to return to exercise without worsening DR, leaks, or pain.',
  },
  {
    imgSrc: '/transformations/20things.png',
    title: '20 Things Every Postpartum Mom Needs to Know',
    value: 900,
    body: 'Critical do’s and don’ts most mothers are never told — but wish they knew earlier.',
  },
];

function ValueStack() {
  return (
    <section className="py-16 md:py-24" style={{ background: C.whisper }}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {BUNDLE.map(({ imgSrc, title, value, body }, idx) => {
            // 7 items in md:grid-cols-2 → 3 full rows + 1 orphan in row 4.
            // The orphan spans both columns but is width-capped + centered
            // so it visually matches a single card. Mobile (1 col) is
            // already centered, so no extra placement needed there.
            const isMdOrphan =
              idx === BUNDLE.length - 1 && BUNDLE.length % 2 === 1;
            const placement = isMdOrphan
              ? 'md:col-span-2 md:mx-auto md:w-full md:max-w-[calc(50%-12px)]'
              : '';
            return (
              <m.article
                key={title}
                variants={fadeUp}
                transition={{ duration: 0.3, ease: EASE }}
                className={`group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${placement}`}
              >
                {/* Top feature graphic */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
                  <Image
                    src={imgSrc}
                    alt={title}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 92vw"
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content — centered on mobile, left-aligned on md+ */}
                <div className="flex flex-1 flex-col p-6 text-center md:text-left">
                  <h3
                    className="font-heading text-[17px] font-bold leading-snug sm:text-[18px]"
                    style={{ color: C.ink }}
                  >
                    {title}
                  </h3>
                  <p
                    className="mt-1 font-heading text-[14px] font-bold"
                    style={{ color: C.brand }}
                  >
                    (₹{value.toLocaleString('en-IN')} Value)
                  </p>
                  <p
                    className="mt-3 flex-1 text-[13.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {body}
                  </p>

                  {/* Instant Access strip */}
                  <div
                    className="mt-5 flex items-center justify-between rounded-lg px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ background: C.whisper, color: C.inkSoft }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightning weight="fill" className="h-3 w-3" style={{ color: C.brand }} />
                      Instant Access
                    </span>
                    <span style={{ color: C.brand }}>Included</span>
                  </div>
                </div>
              </m.article>
            );
          })}
        </m.div>

        {/* Total / CTA */}
        <m.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-10 overflow-hidden rounded-3xl p-8 text-center md:p-10"
          style={{ background: 'white', border: `1px solid ${C.line}` }}
        >
          <p className="font-heading text-[13px] font-bold uppercase tracking-[0.18em]" style={{ color: C.inkMuted }}>
            Total Real Value
          </p>
          <p
            className="mt-1 font-heading text-[36px] font-extrabold leading-none line-through decoration-[3px] underline-offset-2 sm:text-[44px]"
            style={{ color: C.inkSoft, textDecorationColor: '#EF4444' }}
          >
            ₹{VALUE_TOTAL.toLocaleString('en-IN')}
          </p>
          <p className="mt-5 font-heading text-[16px] font-bold uppercase tracking-[0.18em]" style={{ color: C.ink }}>
            All For Just
          </p>
          <p className="mt-1 font-heading text-[56px] font-extrabold leading-none sm:text-[72px]" style={{ color: C.brand }}>
            ₹{PRICE}
          </p>
          <p className="mt-2 text-[13px]" style={{ color: C.inkMuted }}>
            (Introductory price increasing soon)
          </p>

          <div className="mt-7">
            <PrimaryCTA href="/checkout" label={`Get Instant Access · ₹${PRICE} ONLY`} />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: C.inkMuted }}>
              <ShieldCheck weight="fill" className="h-3.5 w-3.5" style={{ color: C.brand }} />
              100% Money-Back Guarantee
            </p>
          </div>
        </m.div>
      </div>
    </section>
  );
}

// ── 13. Founder ──────────────────────────────────────────────────────────────
function Founder() {
  return (
    <section className="py-14 md:py-24 lg:py-28" style={{ background: C.whisper }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-5 md:gap-10 md:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        {/* Mobile-only "Meet your guide" eyebrow + heading (above image).
            Hidden on lg+ where they live inside the bio column on the right. */}
        <div className="lg:hidden">
          <div className="flex justify-center">
            <SectionEyebrow text="Meet your guide" />
          </div>
          <h2
            className="mt-3 text-center font-heading text-[28px] font-extrabold leading-tight sm:text-[34px]"
            style={{ color: C.ink }}
          >
            Who is <span style={{ color: C.brand }}>Dr. Ankita</span>
            <br />
            and why she doesn&apos;t teach <u>guesswork</u>.
          </h2>
        </div>

        {/* Founder portrait — uses object-contain so the full collage
            shows without cropping. Background matches the section's
            whisper tint so any letterbox area blends in seamlessly. */}
        <m.div
          variants={slideRight}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          className="relative w-full overflow-hidden rounded-3xl shadow-card"
          style={{
            border: `1px solid ${C.line}`,
            background: C.whisper,
          }}
        >
          <Image
            src="/transformations/ankitafitness.png"
            alt="Dr. Ankita — women's health physiotherapist"
            width={1200}
            height={1500}
            sizes="(min-width: 1024px) 480px, 92vw"
            className="h-auto w-full select-none object-contain"
            priority={false}
            draggable={false}
          />
        </m.div>

        {/* Bio (desktop has the heading; mobile uses the duplicate above) */}
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
        >
          {/* Eyebrow + heading visible on lg+ only — mobile shows them above the image */}
          <m.div variants={fadeUpSm} className="hidden lg:block">
            <SectionEyebrow text="Meet your guide" />
          </m.div>
          <m.h2
            variants={fadeUp}
            className="mt-3 hidden font-heading text-[28px] font-extrabold leading-tight sm:text-[40px] lg:block"
            style={{ color: C.ink }}
          >
            Who is <span style={{ color: C.brand }}>Dr. Ankita</span>
            <br />
            and why she doesn&apos;t teach <u>guesswork</u>.
          </m.h2>

          <m.p variants={fadeUp} className="mt-5 text-[15px] leading-relaxed sm:text-[16.5px]" style={{ color: C.inkSoft }}>
            Dr. Ankita is a <strong>physiotherapist, certified nutritionist, and mom</strong> who understands that
            postpartum recovery isn&apos;t just about exercise. It&apos;s about helping your body heal through the
            right movement, nutrition, and daily habits.
          </m.p>
          <m.p variants={fadeUp} className="mt-4 text-[15px] leading-relaxed sm:text-[16.5px]" style={{ color: C.inkSoft }}>
            She saw too many moms doing &ldquo;random workouts&rdquo; that actually made their belly gaps and leaks worse. She
            spent <strong>12 years</strong> and helped <strong>4,000+ moms</strong> learn one simple truth:
          </m.p>
          <m.blockquote
            variants={fadeUp}
            className="mt-5 rounded-2xl p-5 font-heading text-[17px] italic leading-relaxed sm:text-[19px]"
            style={{ background: 'white', borderLeft: `3px solid ${C.brand}`, color: C.ink }}
          >
            &ldquo;Healing isn&apos;t about working harder; it&apos;s about doing the right things in the right order.&rdquo;
          </m.blockquote>
          <m.p variants={fadeUp} className="mt-5 text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            That&apos;s why she created this 5-Day Challenge — so you can try the method first and see the results for
            yourself before spending more money.
          </m.p>
        </m.div>
      </div>
    </section>
  );
}

function FounderTile({
  icon: Icon,
  label,
  big,
}: {
  icon: typeof Wind;
  label: string;
  big?: boolean;
}) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl',
        big ? 'aspect-[3/4]' : 'aspect-square',
      ].join(' ')}
      style={{
        background: `linear-gradient(160deg, ${C.blush}, ${C.brand} 110%)`,
      }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <Icon weight="duotone" className={big ? 'h-24 w-24' : 'h-14 w-14'} style={{ color: 'white', opacity: 0.85 }} />
      </div>
      <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur" style={{ color: C.deep }}>
        {label}
      </div>
    </div>
  );
}

// ── 14. Stats ────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="py-10 md:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <StatCard
            icon={ShieldCheck}
            valueNode={<CountUp end={100} suffix="%" className="font-heading text-[36px] font-extrabold leading-none tabular-nums" />}
            label="Satisfaction Rate"
            body="Customised plans and real accountability = results you can actually sustain."
          />
          <StatCard
            icon={Trophy}
            valueNode={<CountUp end={4000} suffix="+" formatThousands className="font-heading text-[36px] font-extrabold leading-none tabular-nums" />}
            label="Lives Transformed"
            body="Helped 4,000+ postpartum moms achieve their dream transformation."
          />
          <StatCard
            icon={Lightning}
            valueNode={<CountUp end={9} suffix=" / 10" className="font-heading text-[36px] font-extrabold leading-none tabular-nums" />}
            label="Postpartum mothers"
            body="Reported improved energy levels as early as one week of starting the program."
          />
        </m.div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  valueNode,
  label,
  body,
}: {
  icon: typeof Wind;
  valueNode: React.ReactNode;
  label: string;
  body: string;
}) {
  return (
    <m.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="rounded-2xl p-7 text-center"
      style={{ background: 'white', border: `1px solid ${C.line}`, boxShadow: '0 18px 50px -32px rgba(199,58,87,0.25)' }}
    >
      <span
        className="mx-auto grid h-14 w-14 place-items-center rounded-full"
        style={{ background: C.blush }}
      >
        <Icon weight="fill" className="h-7 w-7" style={{ color: C.brand }} />
      </span>
      <div className="mt-4" style={{ color: C.brand }}>
        {valueNode}
      </div>
      <div className="mt-1.5 text-[12.5px] font-bold uppercase tracking-[0.16em]" style={{ color: C.inkSoft }}>
        {label}
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkMuted }}>
        {body}
      </p>
    </m.div>
  );
}

// ── 15. Promise ──────────────────────────────────────────────────────────────
function Promise() {
  return (
    <section className="py-16" style={{ background: C.whisper }}>
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <m.div variants={fadeUpSm} className="mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.16em]" style={{ background: 'white', color: C.deep, border: `1px solid ${C.line}` }}>
            <ShieldCheck weight="fill" className="h-3.5 w-3.5" style={{ color: C.brand }} />
            Our Promise to You
          </m.div>
          <m.h2 variants={fadeUp} className="mt-4 font-heading text-[24px] font-extrabold leading-snug sm:text-[34px]" style={{ color: C.ink }}>
            Understand your diagnosis before you do anything else.
          </m.h2>
          <m.p variants={fadeUp} className="mt-5 text-[15px] leading-relaxed sm:text-[16.5px]" style={{ color: C.inkSoft }}>
            If this diagnosis and roadmap don&apos;t make you feel clearer, safer, and more confident about your next step
            — we&apos;ll <strong>refund your ₹{PRICE} instantly</strong>. No questions asked. And yes, you still keep the roadmap.
          </m.p>
        </m.div>
      </div>
    </section>
  );
}

// ── 16. Method (5 pillars) ───────────────────────────────────────────────────
const PILLARS: { icon: typeof Wind; title: string; body: string }[] = [
  { icon: Wind, title: 'Breathing & Pressure Control', body: 'Stops belly push-out, protects DR & pelvic floor.' },
  { icon: HandHeart, title: 'Core + Pelvic Floor Reconnection', body: 'Muscles reconnect before they strengthen.' },
  { icon: Brain, title: 'Stress & Nervous System Load', body: 'Healing doesn’t happen in survival mode.' },
  {
    icon: BowlFood,
    title: 'Postpartum-Supportive Nutrition',
    body: 'Supports tissue healing, hormone recovery, energy levels, and sustainable fat loss without restrictive dieting.',
  },
  { icon: PersonSimpleRun, title: 'Daily Movement Mistakes', body: 'Lifting, feeding & sitting corrected first.' },
];

function Method() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl text-center"
        >
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Read this before you decide" />
          </m.div>
          <m.h2 variants={fadeUp} className="mt-3 font-heading text-[26px] font-extrabold leading-tight sm:text-[40px]" style={{ color: C.ink }}>
            Why this <span style={{ color: C.brand }}>works.</span>
          </m.h2>
          <m.p variants={fadeUp} className="mt-4 text-[15px] sm:text-[16px]" style={{ color: C.inkSoft }}>
            Most postpartum programs push <em>workouts</em> first. That&apos;s why they fail. BodyWorx works because it
            fixes the systems that actually control postpartum healing — <strong>before exercise</strong>.
          </m.p>
        </m.div>

        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <m.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="rounded-2xl p-5"
              style={{ background: 'white', border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: C.blush }}>
                  <Icon weight="duotone" className="h-5 w-5" style={{ color: C.brand }} />
                </span>
                <span className="font-heading text-[12px] font-extrabold tracking-[0.2em]" style={{ color: C.inkMuted }}>
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
                {title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                {body}
              </p>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}

// ── 17. Moms Notice ──────────────────────────────────────────────────────────
const NOTICES: { icon: typeof Wind; label: string }[] = [
  { icon: HandHeart, label: 'Belly feels flatter (without crunches)' },
  { icon: Drop, label: 'Urine leaks reduce or stop' },
  { icon: Bandaids, label: 'Back pain eases' },
  { icon: Wind, label: 'Less bloating after meals' },
  { icon: BowlFood, label: 'Digestion feels lighter' },
  { icon: Pulse, label: 'Better recovery between sessions' },
  { icon: Lightning, label: 'Energy improves' },
  { icon: Sparkle, label: 'Confidence returns' },
];

function MomsNotice() {
  return (
    <section className="py-20 md:py-28" style={{ background: C.whisper }}>
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center">
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="The results" />
          </m.div>
          <m.h2 variants={fadeUp} className="mt-3 font-heading text-[26px] font-extrabold leading-tight sm:text-[40px]" style={{ color: C.ink }}>
            That&apos;s why <span style={{ color: C.brand }}>moms</span> notice…
          </m.h2>
        </m.div>

        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          {NOTICES.map(({ icon: Icon, label }, idx) => {
            // 3-up at lg via a 6-col track (each card spans 2) so a short last
            // row can be centred — plain `grid-cols-3` can only left-align it.
            // The first card of an incomplete last row gets a col-start offset:
            // 2 leftovers → start at col 2 (spans 2–5), 1 leftover → col 3.
            const remainder = NOTICES.length % 3;
            const lastRowStart = NOTICES.length - remainder;
            const offset =
              remainder && idx === lastRowStart
                ? remainder === 2
                  ? 'lg:col-start-2'
                  : 'lg:col-start-3'
                : '';
            return (
            <m.div
              key={label}
              variants={fadeUp}
              className={`flex items-center gap-3 rounded-xl p-4 lg:col-span-2 ${offset}`}
              style={{ background: 'white', border: `1px solid ${C.line}` }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: C.blush }}>
                <Icon weight="duotone" className="h-5 w-5" style={{ color: C.brand }} />
              </span>
              <span className="text-[14.5px] font-medium" style={{ color: C.inkSoft }}>{label}</span>
            </m.div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}

// ── 18. Let's be honest — two options ────────────────────────────────────────
function LetsBeHonest() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center">
          <m.h2 variants={fadeUp} className="font-heading text-[26px] font-extrabold leading-tight sm:text-[38px]" style={{ color: C.ink }}>
            Let&apos;s be honest, <span style={{ color: C.brand }}>this works</span>.<br />
            Now you have <span style={{ color: C.brand }}>two options</span> from here.
          </m.h2>
        </m.div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          <m.div
            variants={slideRight}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl p-7"
            style={{ background: '#F4EEEE', border: `1px solid ${C.line}` }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em]" style={{ background: 'white', color: C.inkMuted }}>
              <X weight="bold" className="h-3 w-3" />
              Option 1
            </div>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              Ignore this, go back to guessing and random workouts, and stay in the same situation with your mummy
              belly, DR, leaks, and confusion.
            </p>
          </m.div>

          <m.div
            variants={slideLeft}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl p-7 text-white"
            style={{ background: `linear-gradient(135deg, ${C.deep}, ${C.brand})` }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] backdrop-blur">
              <Check weight="bold" className="h-3 w-3" />
              Option 2
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">
              Take action and get a doctor-designed postpartum diagnosis + personalized recovery and nutrition
              roadmap, so you know exactly what&apos;s blocking your recovery and what to do next safely.
            </p>
            <Link
              href="/checkout"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-heading text-[14px] font-bold transition-transform duration-200 hover:-translate-y-0.5"
              style={{ color: C.deep }}
            >
              Take Action · ₹{PRICE}
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </m.div>
        </div>
      </div>
    </section>
  );
}

// ── 19. Recap (₹10,000 → ₹PRICE) ─────────────────────────────────────────────
const RECAP: { title: string; value: number }[] = [
  { title: '5-Day Recovery Challenge', value: 2700 },
  { title: 'DR (Diastasis Recti) Gap Check & Analysis', value: 900 },
  { title: 'Core & Pelvic Floor Safety Check', value: 900 },
  { title: 'Posture & Back Pain Fix', value: 900 },
  { title: 'Personalized Postpartum Nutrition Guide', value: 1100 },
  { title: 'Personalized Welcome Video', value: 1700 },
  { title: 'Safe Exercise Starter Guide', value: 900 },
  { title: '20 Mom Secrets Guide', value: 900 },
];

function Recap() {
  return (
    <section className="py-20 md:py-28" style={{ background: C.whisper }}>
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <m.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center">
          <m.div variants={fadeUpSm}>
            <SectionEyebrow text="Final recap" />
          </m.div>
          <m.h2 variants={fadeUp} className="mt-3 font-heading text-[26px] font-extrabold leading-tight sm:text-[38px]" style={{ color: C.ink }}>
            <span style={{ color: C.brand }}>Recap</span> of everything you&apos;ll get.
          </m.h2>
        </m.div>

        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-10 overflow-hidden rounded-3xl"
          style={{ background: 'white', border: `1px solid ${C.line}` }}
        >
          <ul>
            {RECAP.map((r, i) => (
              <m.li
                key={r.title}
                variants={fadeUpSm}
                className="flex items-center justify-between px-5 py-4 text-[14px] sm:text-[15px]"
                style={{
                  borderBottom: i === RECAP.length - 1 ? 'none' : `1px solid ${C.line}`,
                }}
              >
                <span className="flex items-center gap-2.5 font-semibold" style={{ color: C.ink }}>
                  <Check weight="bold" className="h-4 w-4 shrink-0" style={{ color: C.brand }} />
                  {r.title}
                </span>
                <span className="font-heading font-bold" style={{ color: C.brand }}>
                  ₹{r.value.toLocaleString('en-IN')}
                </span>
              </m.li>
            ))}
          </ul>

          <div className="px-5 py-6 text-center" style={{ background: C.whisper, borderTop: `1px solid ${C.line}` }}>
            <p className="font-heading text-[14px] font-bold uppercase tracking-[0.16em]" style={{ color: C.inkSoft }}>
              Total Value
            </p>
            <p
              className="mt-1 font-heading text-[32px] font-extrabold line-through decoration-[3px] underline-offset-2"
              style={{ color: C.inkSoft, textDecorationColor: '#EF4444' }}
            >
              ₹{VALUE_TOTAL.toLocaleString('en-IN')}
            </p>
            <p className="mt-4 font-heading text-[14px] font-bold uppercase tracking-[0.16em]" style={{ color: C.inkSoft }}>
              Get Everything Today For
            </p>
            <p className="mt-1 font-heading text-[48px] font-extrabold leading-none sm:text-[56px]" style={{ color: C.brand }}>
              ₹{PRICE} <span className="text-[18px] font-medium" style={{ color: C.inkMuted }}>(one-time)</span>
            </p>
            <div className="mt-6">
              <PrimaryCTA href="/checkout" label={`Get Instant Access · ₹${PRICE} ONLY`} />
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: C.inkMuted }}>
                <ShieldCheck weight="fill" className="h-3.5 w-3.5" style={{ color: C.brand }} />
                100% Money-Back Guarantee
              </p>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}

// ── 20. Final 70% off strip ──────────────────────────────────────────────────
function FinalStrip() {
  return (
    <section data-final-strip className="relative isolate overflow-hidden py-16 md:py-20" style={{ background: C.black }}>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background: `radial-gradient(ellipse at top, ${C.brand} 0%, transparent 60%)`,
        }}
      />
      <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          <m.div
            variants={fadeUpSm}
            className="mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
            style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.deep})` }}
          >
            <Tag weight="fill" className="h-3.5 w-3.5" />
            70% OFF Today Only
          </m.div>
          <m.h2 variants={fadeUp} className="mt-5 font-heading text-[28px] font-extrabold leading-tight text-white sm:text-[42px]">
            Join the 5-Day Postpartum<br className="hidden sm:block" /> Recovery Challenge — ₹{PRICE}.
          </m.h2>
          <m.div variants={fadeUp} className="mt-8">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-heading text-[16px] font-bold shadow-2xl transition-transform duration-200 hover:-translate-y-0.5"
              style={{ color: C.deep }}
            >
              Get Instant Access
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-[12px] text-white/70">100% Money-Back Guarantee</p>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}

// ── 21. Footer — dark themed, matches the main landing site ─────────────────
function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: C.brand }}>
            BodyWorx · Dr. Ankita Postpartum Recovery Method™
          </p>

          <p className="mx-auto mt-5 max-w-4xl text-[12.5px] leading-relaxed text-white/65 sm:text-[13.5px]">
            All content, programs and coaching services provided by BodyWorx are
            intended for educational and informational purposes only and do not
            guarantee specific results. This is not medical advice. Always consult
            a qualified healthcare professional — including your obstetrician or
            physiotherapist — before making changes to your diet, exercise, or
            lifestyle postpartum. Client results and testimonials vary based on
            individual factors such as consistency, medical history, lifestyle,
            and adherence to the program. Outcomes are not typical or guaranteed.
            This website is not affiliated with or endorsed by Meta. FACEBOOK and
            INSTAGRAM are trademarks of Meta Platforms, Inc.
          </p>

          <p className="mt-6 text-[12px] text-white/55 sm:text-[13px]">
            © {new Date().getFullYear()} BodyWorx. All rights reserved.
          </p>

          <nav
            aria-label="Legal"
            className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-white sm:text-[14px]"
          >
            <Link href="/privacy-policy" className="hover:text-[#FF6E88]">
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-white/35">·</span>
            <Link href="/terms-and-conditions" className="hover:text-[#FF6E88]">
              Terms of Use
            </Link>
            <span aria-hidden="true" className="text-white/35">·</span>
            <Link href="/refund-policy" className="hover:text-[#FF6E88]">
              Refund Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────────
