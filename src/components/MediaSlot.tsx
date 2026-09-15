"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * MediaSlot: the B-roll seam for room media (room page band and clips strip).
 *
 * When real footage arrives it is a data change in `rooms-data.ts`, not a
 * layout change:
 *   public/rooms/video/<room-id>.mp4        -> that room's hero reel
 *   public/rooms/video/<room-id>-01.mp4 ..  -> that room's clips strip
 * Keep clips short, silent and loopable: they autoplay muted.
 *
 * Renders the video when there is one, otherwise the still `poster` image.
 *
 * REDUCED MOTION: `autoPlay` is a mount-time attribute, so the effect below
 * pauses the video directly and hands the visitor controls instead, and
 * follows the preference if it changes mid-session (design-verified 2.6).
 */
export function MediaSlot({
  video,
  poster,
  alt,
  className = "",
  imageClassName = "",
  sizes = "100vw",
  preload = false,
}: {
  video?: string;
  poster: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  preload?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const el = ref.current;
      if (!el) return;
      if (mq.matches) {
        el.pause();
        el.controls = true;
      } else {
        el.controls = false;
        void el.play().catch(() => {
          /* Autoplay can be refused (data saver, low power). The poster frame
             stays up, which is a fine resting state. */
        });
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (video) {
    return (
      <div className={`relative overflow-hidden bg-surface-raised ${className}`}>
        <video
          ref={ref}
          className="h-full w-full object-cover"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
        >
          <source src={video} type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      <Image src={poster} alt={alt} fill sizes={sizes} preload={preload} className={imageClassName} />
    </div>
  );
}
