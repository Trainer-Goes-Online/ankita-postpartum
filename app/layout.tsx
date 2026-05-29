import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Poppins, Fraunces } from 'next/font/google';
import Script from 'next/script';
import UtmCapture from '@/components/UtmCapture';
import MetaPixel from '@/components/MetaPixel';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';
import './globals.css';

const heading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

// preload:false keeps these fonts available (loaded on-demand via their
// @font-face, still display:swap) but removes them from the critical preload
// list so they don't compete with the hero LCP image for early bandwidth.
// Only the heading font (used by the above-the-fold <h1>) stays preloaded.
const body = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: false,
});

// Editorial serif — used for high-impact display headlines (Hero, FinalCTA).
// Loaded once at the root so all sections can opt in via `font-editorial`.
const editorial = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
  preload: false,
});

// ── Tracking IDs ─────────────────────────────────────────────────────────────
// Sourced from .env.local — set NEXT_PUBLIC_GA4_MEASUREMENT_ID and
// NEXT_PUBLIC_CLARITY_PROJECT_ID to render the corresponding scripts below.
// Empty values are treated as "tracker disabled" (script slot skipped).
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? '';
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? '';

const PRICE = CHECKOUT_CONFIG.amountRupeesNumeric;

export const metadata: Metadata = {
  metadataBase: new URL('https://bodyworx.in'),
  title: '5-Day Postpartum Recovery Challenge | BodyWorx',
  description: `A physiotherapist-led postpartum recovery challenge — heal diastasis recti, restore your core and pelvic floor, and rebuild strength in just 5 days for ₹${PRICE}. 100% money-back guarantee.`,
  openGraph: {
    type: 'website',
    title: '5-Day Postpartum Recovery Challenge | BodyWorx',
    description: `Physiotherapist-led postpartum recovery challenge. Heal DR, restore your core, rebuild strength in 5 days — for ₹${PRICE}.`,
    siteName: 'BodyWorx',
  },
  twitter: {
    card: 'summary_large_image',
    title: '5-Day Postpartum Recovery Challenge | BodyWorx',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F24C69',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${editorial.variable}`}>
      <body className="bodyworx-root font-body bg-white text-ink antialiased">
        {/* Marks the document as JS-capable BEFORE first paint so CSS scroll
            reveals (.bw-js .bw-reveal-*) only hide content when JS can reveal
            it — no-JS users and crawlers always see fully-rendered content, and
            there's no reveal flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('bw-js')",
          }}
        />
        {/* Meta Pixel — loads once, fires PageView on every route change.
            Gated by NEXT_PUBLIC_META_PIXEL_ID (renders nothing if unset). */}
        <MetaPixel />

        {/* Site-wide UTM persistence: writes cookie + rewrites URL on every nav */}
        <UtmCapture />

        {children}

        {/* ── Site footer ── */}
        <footer className="bg-ink text-white/70">
          <div className="bw-wrap py-10 sm:py-12">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
                BodyWorx · Dr. Ankita Postpartum Recovery Method™
              </p>

              <p className="mx-auto mt-5 max-w-4xl text-[12.5px] leading-relaxed text-white/65 sm:text-[13.5px]">
                All content, programs and coaching services provided by BodyWorx are
                intended for educational and informational purposes only and do not
                guarantee specific results. This is not medical advice. Always consult
                a qualified healthcare professional — including your obstetrician,
                gynaecologist, or physiotherapist — before making changes to your diet,
                exercise, or lifestyle during your postpartum recovery. Client results and
                testimonials vary based on individual factors such as consistency, medical
                history, lifestyle, time since delivery, mode of delivery, and adherence
                to the program. Outcomes are not typical or guaranteed. This website is
                not affiliated with or endorsed by Meta. FACEBOOK and INSTAGRAM are
                trademarks of Meta Platforms, Inc.
              </p>

              <p className="mt-6 text-[12px] text-white/55 sm:text-[13px]">
                © {new Date().getFullYear()} BodyWorx. All rights reserved.
              </p>

              <nav
                aria-label="Legal"
                className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-white sm:text-[14px]"
              >
                <Link href="/privacy-policy" className="hover:text-brand-bright">
                  Privacy Policy
                </Link>
                <span aria-hidden="true" className="text-white/35">·</span>
                <Link href="/terms-and-conditions" className="hover:text-brand-bright">
                  Terms of Use
                </Link>
                <span aria-hidden="true" className="text-white/35">·</span>
                <Link href="/refund-policy" className="hover:text-brand-bright">
                  Refund Policy
                </Link>
              </nav>
            </div>
          </div>
        </footer>

        {/* Razorpay checkout script is loaded on /checkout only (the sole page
            that opens the modal) — see app/checkout/page.tsx. Keeping it off the
            site-wide layout spares the landing page the Razorpay chunk cascade. */}

        {/* ── GA4 — renders only when ID is filled in ── */}
        {GA4_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_MEASUREMENT_ID}', { send_page_view: true });
            `}</Script>
          </>
        )}

        {/* ── Microsoft Clarity — renders only when ID is filled in ── */}
        {CLARITY_PROJECT_ID && (
          <Script id="clarity-init" strategy="afterInteractive">{`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}</Script>
        )}
      </body>
    </html>
  );
}
