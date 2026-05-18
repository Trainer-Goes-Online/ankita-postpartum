'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

/* ──────────────────────────────────────────────────────────────────────
 *  Sticky CTA bar for the postpartum landing page.
 *  • Visible on mobile, tablet, AND desktop (the prenatal pattern).
 *  • Hidden until the user has scrolled past the hero (~480px).
 *  • Hidden once the page's FinalStrip section enters view (since it
 *    already shows a big CTA — the sticky overlay would be redundant).
 *  • Only meant for the landing route — checkout / thank-you pages do
 *    NOT render this component, so no opt-out logic is needed here.
 *  • Brand-pink-gradient pill matches the postpartum site's palette.
 * ─────────────────────────────────────────────────────────────────── */

const PALETTE = {
  brand: '#F24C69',
  deep: '#C73A57',
  line: '#F2D6DD',
  inkMuted: '#8C6B74',
};

export default function StickyCTA() {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [finalStripInView, setFinalStripInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPastHero(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Target FinalStrip (the big bottom CTA). When it scrolls into view,
    // hide the sticky bar so two CTAs don't compete visually.
    const target = document.querySelector('[data-final-strip]');
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => setFinalStripInView(entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px', threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const visible = scrolledPastHero && !finalStripInView;

  return (
    <div
      aria-hidden={!visible}
      className={[
        'pointer-events-none fixed inset-x-0 bottom-0 z-40',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="pointer-events-auto px-4 pt-3 pb-3 backdrop-blur-md md:px-8"
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          borderTop: `1px solid ${PALETTE.line}`,
          boxShadow: '0 -8px 24px -12px rgba(199, 58, 87, 0.25)',
        }}
      >
        <div className="mx-auto flex max-w-[1180px] flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
          <div
            className="flex items-center justify-center gap-2 text-[11px] font-medium md:justify-start md:text-[13px]"
            style={{ color: PALETTE.inkMuted }}
          >
            <ShieldCheck
              weight="fill"
              size={14}
              aria-hidden="true"
              style={{ color: PALETTE.brand }}
            />
            <span>100% Money-Back Guarantee · Starts {CHECKOUT_CONFIG.webinarDate}</span>
          </div>
          <Link
            href="/checkout"
            aria-label="Start your 5-day postpartum challenge — opens checkout"
            className="group inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full px-6 py-3.5 font-heading text-[15px] font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 md:w-auto md:min-w-[320px] md:text-[15.5px]"
            style={{
              background: `linear-gradient(180deg, ${PALETTE.brand}, ${PALETTE.deep})`,
              boxShadow: '0 18px 40px -14px rgba(199,58,87,0.55)',
            }}
          >
            Get Instant Access · ₹{CHECKOUT_CONFIG.amountRupeesNumeric}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform group-hover:translate-x-0.5"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
