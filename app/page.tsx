/**
 * / — 5-Day Postpartum Recovery Challenge landing page.
 *
 * Server Component shell. The above-the-fold hero (./_landing/hero) is pure
 * static HTML — zero JavaScript on the critical path — so the LCP mockup
 * image paints immediately. Everything below the fold lives in
 * ./_landing/below-fold, a client component pulled in via next/dynamic so its
 * Framer Motion bundle loads in a separate, deferred chunk (ssr:true keeps all
 * its markup/content in the server HTML — no SEO or visual change).
 *
 * Price reads from CHECKOUT_CONFIG via ./_landing/shared so the env var
 * NEXT_PUBLIC_OFFER_PRICE_RUPEES still controls what users pay.
 */
import dynamic from 'next/dynamic';
import { C } from './_landing/shared';
import { UrgencyStrip, Hero } from './_landing/hero';

const BelowFold = dynamic(() => import('./_landing/below-fold'));

export default function Page() {
  return (
    <main style={{ background: C.cream, color: C.ink }} className="overflow-x-hidden font-body">
      <UrgencyStrip />
      <Hero />
      <BelowFold />
    </main>
  );
}
