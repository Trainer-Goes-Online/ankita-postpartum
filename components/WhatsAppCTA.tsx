'use client';

import type { CSSProperties, ReactNode } from 'react';
import { trackGa4EventOnce } from '@/lib/ga4';

type WhatsAppCTAProps = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * WhatsApp community anchor for /thank-you. Fires GA4 `join_whatsapp`
 * exactly once per browser (deduped inside trackGa4EventOnce via
 * bw_ga4_wa_fired). target="_blank" keeps the current tab alive so the
 * synchronous gtag call always makes it out.
 *
 * Multiple instances on the same page (hero card + mid-page CTA + mobile
 * sticky) all route through this wrapper; whichever the visitor clicks
 * first is the one that fires — the other clicks silently dedup.
 */
export default function WhatsAppCTA({ href, className, style, children }: WhatsAppCTAProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => trackGa4EventOnce('join_whatsapp')}
    >
      {children}
    </a>
  );
}
