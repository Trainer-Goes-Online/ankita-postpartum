/**
 * Testimonial assets.
 *
 * All images live under `/public/testimonials/…` (downloaded locally from
 * the legacy WordPress site so this project does not break when WP is taken
 * down).
 *
 * - `VIDEO_TESTIMONIALS`: 6 mum testimonial videos, each with a poster
 *   thumbnail and the Vimeo URL.
 * - `WHATSAPP_TESTIMONIALS`: 34 chat screenshots for the "real-messages"
 *   social-proof grid.
 */

export type VideoTestimonial = {
  /** Local poster image path (in /public). */
  poster: string;
  /** Public Vimeo watch URL — opens in a new tab / lightbox. */
  vimeoUrl: string;
  /** Numeric Vimeo ID, used to embed the player inside a lightbox. */
  vimeoId: string;
};

export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    poster: '/testimonials/videos/video-1.png',
    vimeoUrl: 'https://vimeo.com/1159597604',
    vimeoId: '1159597604',
  },
  {
    poster: '/testimonials/videos/video-2.png',
    vimeoUrl: 'https://vimeo.com/1159597795',
    vimeoId: '1159597795',
  },
  {
    poster: '/testimonials/videos/video-3.png',
    vimeoUrl: 'https://vimeo.com/1159597829',
    vimeoId: '1159597829',
  },
  {
    poster: '/testimonials/videos/video-4.png',
    vimeoUrl: 'https://vimeo.com/1159597641',
    vimeoId: '1159597641',
  },
  {
    poster: '/testimonials/videos/video-5.png',
    vimeoUrl: 'https://vimeo.com/1159597665',
    vimeoId: '1159597665',
  },
  {
    poster: '/testimonials/videos/video-6.png',
    vimeoUrl: 'https://vimeo.com/1159597702',
    vimeoId: '1159597702',
  },
];

/** All 34 image testimonials (before/after, chat screenshots, etc.) used in
 *  the Transformations masonry grid. */
export const IMAGE_TESTIMONIALS: string[] = Array.from(
  { length: 34 },
  (_, i) => `/testimonials/whatsapp/chat-${i + 1}.png`,
);
