/**
 * Shared landing-page primitives — palette, offer constants, and the two
 * framer-free leaf components used by BOTH the static above-the-fold hero
 * (server-rendered, zero JS) and the lazily-hydrated below-the-fold chunk.
 *
 * Kept framer-motion-free on purpose so it can be imported from a Server
 * Component without dragging the animation runtime into the initial bundle.
 */
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

// ── Palette (inline so / can't leak into the existing pink site at /) ─
export const C = {
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

export const PRICE = CHECKOUT_CONFIG.amountRupeesNumeric;
export const LIST = CHECKOUT_CONFIG.listPriceRupees;
export const VALUE_TOTAL = 10000;
export const WEBINAR_DATE = CHECKOUT_CONFIG.webinarDate;
export const WEBINAR_TIMES = CHECKOUT_CONFIG.webinarTimes;

export function SectionEyebrow({ text }: { text: string }) {
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

export function PrimaryCTA({ href, label }: { href: string; label: string }) {
  // Full-width on mobile, natural pill width from sm+ upward.
  return (
    <Link
      href={href}
      className="group inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full px-7 py-4 font-heading text-[15px] font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 sm:w-auto"
      style={{
        background: `linear-gradient(180deg, ${C.brand}, ${C.deep})`,
        boxShadow: '0 18px 40px -14px rgba(199,58,87,0.55)',
      }}
    >
      {label}
      <ArrowRight weight="bold" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
