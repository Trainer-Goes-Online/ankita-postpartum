'use client';

import { useEffect } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';

type VideoLightboxProps = {
  /**
   * Direct MP4 URL, or a player.vimeo.com URL. When set, the modal is open.
   * `null` = closed.
   */
  videoUrl: string | null;
  onClose: () => void;
};

/** Vimeo-hosted testimonials must use the iframe embed — a player.vimeo.com
 *  URL is a player page, not a media file, so <video src> cannot play it. */
function isVimeo(url: string): boolean {
  return /(^|\.)vimeo\.com\//.test(url);
}

/**
 * Full-screen video lightbox.
 *
 * - Renders a fixed overlay above the page when `videoUrl` is set.
 * - Plays CDN MP4s via HTML5 <video>, and Vimeo-hosted clips via the Vimeo
 *   iframe embed, at 100% width inside a 16:9 frame.
 * - Closes on ESC, on overlay-click, or via the X button.
 * - Locks body scroll while open.
 *
 * The lightbox opens in response to a user click, so autoplay-with-audio is
 * permitted by every modern browser. We deliberately do not set `muted` so
 * the testimonial speaks the moment it appears.
 */
export default function VideoLightbox({ videoUrl, onClose }: VideoLightboxProps) {
  // ESC to close + lock body scroll while open.
  useEffect(() => {
    if (!videoUrl) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [videoUrl, onClose]);

  if (!videoUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video testimonial"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl"
        // Stop clicks on the frame from closing the modal — only the
        // backdrop and the explicit close button should dismiss.
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
        >
          <X weight="bold" className="h-5 w-5" />
        </button>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          {/* key=videoUrl forces React to remount when the URL changes, so
              the player resets cleanly between testimonials instead of
              continuing the previous one. */}
          {isVimeo(videoUrl) ? (
            <iframe
              key={videoUrl}
              src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&title=0&byline=0&portrait=0&dnt=1`}
              title="Video testimonial"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
