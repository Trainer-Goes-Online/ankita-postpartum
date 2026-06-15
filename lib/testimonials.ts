/**
 * Testimonial assets.
 *
 * All poster images live under `/public/testimonials/…` (downloaded locally
 * from the legacy WordPress site so this project does not break when WP is
 * taken down). The actual video files now live on our DigitalOcean Spaces
 * CDN — we migrated off Vimeo when their plan capped us.
 *
 * - `VIDEO_TESTIMONIALS`: 6 mum testimonial videos, each with a local poster
 *   thumbnail and a direct MP4 URL on the CDN.
 * - `WHATSAPP_TESTIMONIALS` (below): 34 chat screenshots for the
 *   "real-messages" social-proof grid.
 */

export type VideoTestimonial = {
  /** Person's first name — used as the React key + accessibility label. */
  name: string;
  /** Local poster image path (in /public). */
  poster: string;
  /** Direct MP4 URL on our CDN. Played via HTML5 <video> in the lightbox. */
  videoUrl: string;
};

export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    name: 'Dr. Milli',
    poster: '/testimonials/videos/video-1.png',
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/dr_milli%20(540p).mp4',
  },
  {
    name: 'Lovely',
    poster: '/testimonials/videos/video-2.png',
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/lovely%20(540p).mp4',
  },
  {
    name: 'Meera',
    poster: '/testimonials/videos/video-3.png',
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/meera%20(540p).mp4',
  },
  {
    name: 'Megha',
    poster: '/testimonials/videos/video-4.png',
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/megha%20(540p).mp4',
  },
  {
    name: 'Priyanka',
    poster: '/testimonials/videos/video-5.png',
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/priyanka%20(540p).mp4',
  },
  {
    name: 'Vaishnavi',
    poster: '/testimonials/videos/video-6.png',
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/vaishnavi%20(540p).mp4',
  },
];

/** All 34 image testimonials (before/after, chat screenshots, etc.) used in
 *  the Transformations masonry grid. */
export const IMAGE_TESTIMONIALS: string[] = Array.from(
  { length: 34 },
  (_, i) => `/testimonials/whatsapp/chat-${i + 1}.png`,
);
