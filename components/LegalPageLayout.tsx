import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

type LegalPageLayoutProps = {
  title: string;
  effectiveDate: string;
  intro: string;
  children: React.ReactNode;
};

export default function LegalPageLayout({
  title,
  effectiveDate,
  intro,
  children,
}: LegalPageLayoutProps) {
  return (
    <main className="bg-white">
      <header className="relative overflow-hidden bg-brand-gradient py-14 text-white sm:py-16 lg:py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.18)_0%,_transparent_55%)]"
        />
        <div className="bw-wrap relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/90 hover:text-white sm:text-[13.5px]"
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" />
            Back to BodyWorx
          </Link>
          <h1 className="mt-5 font-heading text-[30px] font-extrabold leading-[1.06] text-white sm:text-[40px] lg:text-[48px]">
            {title}
          </h1>
          <p className="mt-3 text-[12.5px] font-medium uppercase tracking-[0.18em] text-white/80 sm:text-[13px]">
            Effective {effectiveDate}
          </p>
        </div>
      </header>

      <article className="bw-wrap max-w-3xl py-12 sm:py-16 lg:py-20">
        <p className="text-[15.5px] leading-relaxed text-ink-soft sm:text-[16.5px]">
          {intro}
        </p>
        <div className="legal-content mt-8 space-y-7 text-[15px] leading-relaxed text-ink-soft sm:mt-10 sm:text-[16px]">
          {children}
        </div>
      </article>
    </main>
  );
}
