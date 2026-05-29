'use client';

/**
 * motion-lite — a tiny drop-in replacement for the subset of the framer-motion
 * API used by the landing page's below-the-fold sections. It renders plain DOM
 * elements and drives entrance animations with CSS + a single shared
 * IntersectionObserver, so the page ships ZERO framer-motion JavaScript and the
 * heavy below-the-fold tree hydrates cheaply (the LCP/render-delay win).
 *
 * Supported surface (everything below-fold.tsx uses):
 *   m.<tag>                         → plain <tag>
 *   variants + initial="hidden" + whileInView="show"  → CSS scroll-reveal
 *   initial={{...}} + whileInView={{...}}              → CSS scroll-reveal
 *   animate={{ x: [...] }} (+ transition.duration)     → CSS infinite marquee
 *   whileHover={{ y } | { scale }}                     → CSS :hover transform
 *   useReducedMotion / useScroll / useTransform        → no-op stubs (CSS @media
 *                                                        handles reduced-motion)
 *   LazyMotion / domAnimation                          → provider + no-op
 *
 * Visual result matches the framer version: fade/slide/scale-in on scroll,
 * continuous marquees, hover lifts. The only intentional difference is the
 * scroll-progress line (FiveDaySchedule), which renders fully filled instead of
 * scroll-linked — a decorative detail.
 */
import React, { forwardRef, useEffect } from 'react';

export type Variants = Record<string, Record<string, unknown>>;
export const domAnimation = {} as const;

// Single observer for the whole subtree. Reveal elements are PURE (no hooks),
// so hydration is cheap; this one effect finds every [data-bw-reveal] and adds
// the `bw-in` class via the DOM when it scrolls into view. Because the elements'
// className prop never changes, React reconciliation never wipes `bw-in`.
export function LazyMotion({ children }: { children: React.ReactNode; features?: unknown }) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-bw-reveal]'));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('bw-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return <>{children}</>;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// Derive the reveal CSS class from a framer "hidden"/initial state object.
function revealClassFor(hidden: Record<string, unknown> | null): string | null {
  if (!hidden) return null;
  const { x, y, scale, opacity } = hidden as Record<string, number | undefined>;
  if (typeof scale === 'number') return 'bw-reveal-scale';
  if (typeof x === 'number' && x !== 0) return x < 0 ? 'bw-reveal-right' : 'bw-reveal-left';
  if (typeof y === 'number' && y !== 0) return Math.abs(y) <= 16 ? 'bw-reveal-up-sm' : 'bw-reveal-up';
  if (typeof opacity === 'number' && opacity === 0) return 'bw-reveal-fade';
  return null; // empty (e.g. stagger container) → no reveal of its own
}

function hoverClassFor(hover: Record<string, unknown> | undefined): string | null {
  if (!hover) return null;
  const h = hover as Record<string, number | undefined>;
  if (typeof h.scale === 'number') return 'bw-hover-scale';
  if (typeof h.y === 'number') return h.y <= -4 ? 'bw-hover-lift' : 'bw-hover-lift-sm';
  return null;
}

type StyleLike = React.CSSProperties & Record<string, unknown>;

// Keep only primitive style values (drops framer MotionValues like scaleY).
function sanitizeStyle(style: StyleLike | undefined): React.CSSProperties | undefined {
  if (!style) return style;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style)) {
    if (v == null) continue;
    if (typeof v === 'string' || typeof v === 'number') out[k] = v;
    // non-primitive (MotionValue) → skip
  }
  return out as React.CSSProperties;
}

type MotionProps = {
  variants?: Variants;
  initial?: unknown;
  animate?: unknown;
  whileInView?: unknown;
  whileHover?: Record<string, unknown>;
  whileTap?: unknown;
  transition?: { duration?: number } & Record<string, unknown>;
  viewport?: unknown;
  custom?: unknown;
  className?: string;
  style?: StyleLike;
  children?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/* ── Reveal element (scroll-triggered) ──────────────────────────────────────── */
// Pure: no hooks, no state — just static markup with `data-bw-reveal` + the
// initial-hidden class. The shared observer in <LazyMotion> adds `bw-in` when it
// enters the viewport. Cheap to hydrate (effectively a plain element).
function RevealEl({
  tag,
  revealClass,
  hoverClass,
  className,
  style,
  children,
  ...rest
}: { tag: string; revealClass: string; hoverClass: string | null } & MotionProps) {
  const Tag = tag as unknown as React.ElementType;
  return (
    <Tag
      data-bw-reveal=""
      className={cx(className, 'bw-reveal', revealClass, hoverClass)}
      style={sanitizeStyle(style)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ── Factory: one component per tag ─────────────────────────────────────────── */
const cache = new Map<string, React.ComponentType<MotionProps>>();

function getComponent(tag: string): React.ComponentType<MotionProps> {
  const hit = cache.get(tag);
  if (hit) return hit;

  const Comp = forwardRef<HTMLElement, MotionProps>(function MotionLite(props, ref) {
    const {
      variants,
      initial,
      animate,
      whileInView,
      whileHover,
      whileTap: _whileTap,
      transition,
      viewport: _viewport,
      custom: _custom,
      className,
      style,
      children,
      ...rest
    } = props;
    const Tag = tag as unknown as React.ElementType;
    const hoverClass = hoverClassFor(whileHover);

    // Marquee: animate={{ x: [...] }}
    if (animate && typeof animate === 'object' && Array.isArray((animate as { x?: unknown }).x)) {
      const xs = (animate as { x: string[] }).x;
      const dir = xs[0] === '0%' ? 'bw-marq-left' : 'bw-marq-right';
      const dur = transition?.duration ?? 30;
      return (
                <Tag
          ref={ref}
          className={cx(className, 'bw-marq', dir)}
          style={{ ...(sanitizeStyle(style) || {}), ['--bw-marq-dur' as string]: `${dur}s` }}
          {...rest}
        >
          {children}
        </Tag>
      );
    }

    // Reveal: variants + initial="hidden"/whileInView, or object initial+whileInView
    const hidden =
      (variants && (variants.hidden as Record<string, unknown>)) ||
      (initial && typeof initial === 'object' ? (initial as Record<string, unknown>) : null);
    const isReveal =
      !!hidden && (initial === 'hidden' || whileInView === 'show' || typeof whileInView === 'object' || typeof initial === 'object');
    const revealClass = isReveal ? revealClassFor(hidden) : null;

    if (revealClass) {
      return (
        <RevealEl tag={tag} revealClass={revealClass} hoverClass={hoverClass} className={className} style={style} {...rest}>
          {children}
        </RevealEl>
      );
    }

    // Plain / hover-only / stagger container
    return (
            <Tag ref={ref} className={cx(className, hoverClass)} style={sanitizeStyle(style)} {...rest}>
        {children}
      </Tag>
    );
  });

  cache.set(tag, Comp as React.ComponentType<MotionProps>);
  return Comp as React.ComponentType<MotionProps>;
}

export const m: Record<string, React.ComponentType<MotionProps>> = new Proxy(
  {},
  { get: (_t, tag: string) => getComponent(tag) },
) as Record<string, React.ComponentType<MotionProps>>;

/* ── Hook stubs ──────────────────────────────────────────────────────────────── */
export function useReducedMotion(): boolean {
  return false;
}
export function useScroll(_opts?: unknown): { scrollYProgress: undefined; scrollY: undefined } {
  return { scrollYProgress: undefined, scrollY: undefined };
}
export function useTransform(..._args: unknown[]): undefined {
  return undefined;
}
