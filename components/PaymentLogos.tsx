/**
 * Premium payment-method logo row. Inline SVGs (no external assets) so the
 * row reads as a polished brand strip — VISA, Mastercard, RuPay, UPI, Amex,
 * Maestro — instead of plain text labels.
 *
 * Each logo is rendered inside a small white tile with a soft border so they
 * line up cleanly regardless of intrinsic aspect ratio.
 */

type LogoProps = { className?: string };

function VisaLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M28.4 1.4L24.6 20.6h-4.7L23.7 1.4h4.7zM48.7 13.8l2.5-6.9 1.4 6.9h-3.9zm5.3 6.8H58l-3.8-19.2h-4c-.9 0-1.7.5-2 1.4l-7.1 17.8h4.9l1-2.7h6l.5 2.7zM41.9 14.4c0-4.7-6.6-5-6.5-7.1 0-.6.6-1.3 2-1.5.7-.1 2.5-.2 4.7 1l.8-3.8c-1.1-.4-2.6-.9-4.5-.9-4.7 0-8 2.5-8 6.1 0 2.7 2.4 4.1 4.2 5 1.9.9 2.5 1.5 2.5 2.3 0 1.3-1.5 1.8-2.9 1.8-2.5 0-3.9-.7-5-1.2l-.9 3.9c1.2.5 3.4 1 5.7 1 5 0 8.2-2.5 8.2-6.3M21.8 1.4L14.2 20.6H9.3l-3.7-14.4C5.4 5.4 5.2 5.1 4.6 4.8 3.5 4.2 1.7 3.7 0 3.4l.1-.5h7.9c1 0 1.9.7 2.1 1.9l2 10.5L17 1.4h4.8z"
        fill="#1A1F71"
      />
    </svg>
  );
}

function MastercardLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="18" cy="15" r="11" fill="#EB001B" />
      <circle cx="30" cy="15" r="11" fill="#F79E1B" />
      <path
        d="M24 7.5a10.97 10.97 0 010 15 10.97 10.97 0 010-15z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="56" height="22" rx="2" fill="#006FCF" />
      <text
        x="28"
        y="10"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="5.6"
        letterSpacing="0.4"
      >
        AMERICAN
      </text>
      <text
        x="28"
        y="17"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="5.6"
        letterSpacing="0.4"
      >
        EXPRESS
      </text>
    </svg>
  );
}

function RupayLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 70 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <text
        x="0"
        y="16"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="-0.4"
      >
        <tspan fill="#097D3A">Ru</tspan>
        <tspan fill="#F37021">Pay</tspan>
      </text>
      {/* Arrow accent (Rupay's signature ">" mark next to "Pay") */}
      <path
        d="M52 6 L 58 11 L 52 16"
        stroke="#F37021"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function UpiLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* "UPI" wordmark */}
      <text
        x="0"
        y="16"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="-0.4"
      >
        <tspan fill="#097D3A">U</tspan>
        <tspan fill="#1A4FA0">P</tspan>
        <tspan fill="#F37021">I</tspan>
      </text>
      {/* Tri-color triangle accent next to wordmark — UPI brand mark */}
      <g transform="translate(33,4)">
        <path d="M0 14 L 7 0 L 14 14 Z" fill="#097D3A" opacity="0.95" />
        <path d="M3 14 L 8.5 3 L 14 14 Z" fill="#1A4FA0" opacity="0.95" />
        <path d="M7 14 L 10 8 L 14 14 Z" fill="#F37021" opacity="0.95" />
      </g>
    </svg>
  );
}

function MaestroLogo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="18" cy="15" r="11" fill="#0099DF" />
      <circle cx="30" cy="15" r="11" fill="#ED1C2E" />
      <path
        d="M24 7.5a10.97 10.97 0 010 15 10.97 10.97 0 010-15z"
        fill="#7375CF"
      />
    </svg>
  );
}

type Brand = { id: string; label: string; Logo: (p: LogoProps) => JSX.Element; w: string };

// `compact` row drops Maestro (visually nearly identical to Mastercard) so the
// most common 5 fit cleanly in a single row on mobile — no orphan logo wrapping
// to its own line. `full` row shows all 6 in the checkout strip.
const COMPACT_LOGOS: Brand[] = [
  { id: 'visa', label: 'Visa', Logo: VisaLogo, w: 'w-9' },
  { id: 'mc', label: 'Mastercard', Logo: MastercardLogo, w: 'w-7' },
  { id: 'rupay', label: 'RuPay', Logo: RupayLogo, w: 'w-10' },
  { id: 'upi', label: 'UPI', Logo: UpiLogo, w: 'w-10' },
  { id: 'amex', label: 'American Express', Logo: AmexLogo, w: 'w-9' },
];

const FULL_LOGOS: Brand[] = [
  { id: 'visa', label: 'Visa', Logo: VisaLogo, w: 'w-10' },
  { id: 'mc', label: 'Mastercard', Logo: MastercardLogo, w: 'w-8' },
  { id: 'rupay', label: 'RuPay', Logo: RupayLogo, w: 'w-12' },
  { id: 'upi', label: 'UPI', Logo: UpiLogo, w: 'w-12' },
  { id: 'amex', label: 'American Express', Logo: AmexLogo, w: 'w-10' },
  { id: 'maestro', label: 'Maestro', Logo: MaestroLogo, w: 'w-8' },
];

type PaymentLogosProps = {
  /** Visual density. `compact` is used inside the hero offer card; `full` for checkout. */
  size?: 'compact' | 'full';
  /** Optional className applied to the outer wrapper. */
  className?: string;
};

export default function PaymentLogos({ size = 'full', className }: PaymentLogosProps) {
  const isCompact = size === 'compact';
  const logos = isCompact ? COMPACT_LOGOS : FULL_LOGOS;
  return (
    <div
      role="list"
      aria-label="Accepted payment methods"
      className={[
        'flex flex-wrap items-center justify-center',
        isCompact ? 'gap-1' : 'gap-1.5 sm:gap-2',
        className ?? '',
      ].join(' ')}
    >
      {logos.map(({ id, label, Logo, w }) => (
        <div
          key={id}
          role="listitem"
          aria-label={label}
          className={[
            'inline-flex items-center justify-center rounded-md border border-line bg-white shadow-soft',
            isCompact ? 'h-5 px-1' : 'h-7 px-1.5 sm:h-8 sm:px-2',
          ].join(' ')}
        >
          <Logo className={[w, isCompact ? 'max-h-3.5' : 'max-h-4 sm:max-h-5'].join(' ')} />
        </div>
      ))}
    </div>
  );
}
