/* ──────────────────────────────────────────────────────────────────────
 *  <Icon3D> — site-wide 3D icon component.
 *  Loads Microsoft Fluent 3D Emoji from the Iconify CDN — high-quality
 *  3D-rendered icons, zero local assets, zero downloads.
 *
 *  Pass a semantic short name (e.g. "heart", "laptop") — the ICON_MAP
 *  resolves it to the actual Fluent Emoji slug. Unmapped names fall
 *  through directly to the CDN so you can use any Fluent Emoji name
 *  without touching this file.
 * ─────────────────────────────────────────────────────────────────── */

type Icon3DProps = {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
};

const ICON_MAP: Record<string, string> = {
  // Hero trust strip
  heart: 'red-heart',
  laptop: 'laptop',
  yoga: 'person-in-lotus-position',
  refund: 'money-with-wings',

  // DoesThisSoundLikeYou — pain qualification states (object icons, not faces)
  'back-pain': 'warning',
  scared: 'no-entry',
  worry: 'thought-balloon',
  tired: 'alarm-clock',
  confused: 'puzzle-piece',

  // BodyWorxMethod — 5 method pillars
  breathing: 'leaf-fluttering-in-wind',
  'pelvic-core': 'flexed-biceps',
  mobility: 'person-walking',
  nutrition: 'green-apple',
  'labor-prep': 'baby',

  // /new-page — trust strip + hero chips
  shield: 'shield',
  locked: 'locked',
  calendar: 'spiral-calendar',
  clock: 'alarm-clock',
};

const CDN_BASE = 'https://api.iconify.design/fluent-emoji';

export default function Icon3D({
  name,
  size = 28,
  className,
  alt = '',
}: Icon3DProps) {
  const slug = ICON_MAP[name] ?? name;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${CDN_BASE}/${slug}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={className}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}
