'use client';

import { useEffect, useRef, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────
 *  <CountUp> — animates a number from 0 to `end` once it scrolls into
 *  view. Eases out cubic, supports decimals, prefix, suffix.
 *  Respects `prefers-reduced-motion` by snapping to the end value.
 * ─────────────────────────────────────────────────────────────────── */

type CountUpProps = {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** When true, format with locale grouping (e.g. 4000 → "4,000"). */
  formatThousands?: boolean;
  className?: string;
};

export default function CountUp({
  end,
  duration = 1800,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatThousands = false,
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Trigger when the element enters the viewport.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== 'undefined') {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setValue(end);
        setStarted(true);
        return;
      }
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [end]);

  // Run the count animation once started.
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(end * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  const display = formatThousands
    ? Math.round(value).toLocaleString('en-IN')
    : value.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
