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
  /**
   * Where the video plays from. Either a direct MP4 on our CDN (rendered as an
   * HTML5 <video>) or a player.vimeo.com URL (rendered as an iframe embed) —
   * VideoLightbox picks the right player by sniffing the host.
   */
  videoUrl: string;
};

// NOTE on the videoUrl filenames below: the MP4s on the CDN were uploaded with
// filenames that don't match the testimonial content (a 5-cycle mislabel).
// e.g. priyanka(540p).mp4 actually contains Dr. Milli's testimonial. Each
// entry below pairs the right name + poster with the URL whose content
// matches the person — so the tile plays whose face it shows. Don't be
// confused by the name/URL filename mismatch; trust the per-entry comment.
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    name: 'Dr. Milli',
    poster: '/testimonials/videos/video-1.png',
    // CDN file labelled "priyanka" actually contains Dr. Milli's testimonial.
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/priyanka%20(540p).mp4',
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
    // CDN file labelled "vaishnavi" actually contains Meera's testimonial.
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/vaishnavi%20(540p).mp4',
  },
  {
    name: 'Megha',
    poster: '/testimonials/videos/video-4.png',
    // CDN file labelled "dr_milli" actually contains Megha's testimonial.
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/dr_milli%20(540p).mp4',
  },
  {
    name: 'Priyanka',
    poster: '/testimonials/videos/video-5.png',
    // CDN file labelled "meera" actually contains Priyanka's testimonial.
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/meera%20(540p).mp4',
  },
  {
    name: 'Vaishnavi',
    poster: '/testimonials/videos/video-6.png',
    // CDN file labelled "megha" actually contains Vaishnavi's testimonial.
    videoUrl:
      'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Ankita/megha%20(540p).mp4',
  },
];

/**
 * Second batch of video testimonials — rendered in the lower marquee row,
 * scrolling the opposite way to VIDEO_TESTIMONIALS above.
 *
 * These live on the "Trainer GoesOnline" Vimeo account rather than the DO
 * Spaces CDN (they were never uploaded there), so they play through Vimeo's
 * iframe embed instead of an HTML5 <video>. If they are ever moved onto the
 * CDN, swap `videoUrl` for the direct MP4 and the lightbox needs no change.
 *
 * Posters are frames pulled from each video and cropped to the 3:4 tile ratio.
 * Because these are Zoom/phone screen-recordings, the frames were trimmed to
 * drop the OS status bar and player chrome that sat top and bottom.
 */
export const VIDEO_TESTIMONIALS_2: VideoTestimonial[] = [
  { name: 'Nidhi Pandey',     poster: '/testimonials/videos-2/nidhi-pandey.jpg',     videoUrl: 'https://player.vimeo.com/video/1213468575' },
  { name: 'Lakshmi Naveen',   poster: '/testimonials/videos-2/lakshmi-naveen.jpg',   videoUrl: 'https://player.vimeo.com/video/1213468570' },
  { name: 'Abinaya',          poster: '/testimonials/videos-2/abinaya.jpg',          videoUrl: 'https://player.vimeo.com/video/1213468578' },
  { name: 'Preethi',          poster: '/testimonials/videos-2/preethi.jpg',          videoUrl: 'https://player.vimeo.com/video/1213468571' },
  { name: 'Pooja Sharath',    poster: '/testimonials/videos-2/pooja-sharath.jpg',    videoUrl: 'https://player.vimeo.com/video/1213468579' },
  { name: 'Sindhu Reddy',     poster: '/testimonials/videos-2/sindhu-reddy.jpg',     videoUrl: 'https://player.vimeo.com/video/1213468598' },
  { name: 'Divya',            poster: '/testimonials/videos-2/divya.jpg',            videoUrl: 'https://player.vimeo.com/video/1213468586' },
  { name: 'Sarita Ghanshani', poster: '/testimonials/videos-2/sarita-ghanshani.jpg', videoUrl: 'https://player.vimeo.com/video/1213468583' },
  { name: 'Raman Preet',      poster: '/testimonials/videos-2/raman-preet.jpg',      videoUrl: 'https://player.vimeo.com/video/1213468587' },
  { name: 'Pooja',            poster: '/testimonials/videos-2/pooja.jpg',            videoUrl: 'https://player.vimeo.com/video/1213468568' },
  { name: 'Sindhu Madhuri',   poster: '/testimonials/videos-2/sindhu-madhuri.jpg',   videoUrl: 'https://player.vimeo.com/video/1213468590' },
  { name: 'Madhu Khuti',      poster: '/testimonials/videos-2/madhu-khuti.jpg',      videoUrl: 'https://player.vimeo.com/video/1213468580' },
  { name: 'Nasim Shah',       poster: '/testimonials/videos-2/nasim-shah.jpg',       videoUrl: 'https://player.vimeo.com/video/1213468567' },
];

/** All 34 image testimonials (before/after, chat screenshots, etc.) used in
 *  the Transformations masonry grid. */
export const IMAGE_TESTIMONIALS: string[] = Array.from(
  { length: 34 },
  (_, i) => `/testimonials/whatsapp/chat-${i + 1}.png`,
);
