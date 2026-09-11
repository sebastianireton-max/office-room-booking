"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * MediaSlot — the single B-roll seam for the whole site.
 *
 * Every place the site shows a room (homepage showcase tiles, room detail
 * hero, the clips strip, cross-sell cards) renders through here, so when real
 * footage arrives it is a data change in `rooms-data.ts`, not a layout change
 * in six components.
 *
 * DROP-IN PATHS, for whoever has the footage:
 *   public/rooms/video/<room-id>.mp4        -> that room's hero reel
 *   public/rooms/video/<room-id>-01.mp4 ..  -> that room's clips strip
 * then add `reel` / `clips` to the room in `src/lib/rooms-data.ts`. Nothing
 * else needs to change. Keep clips short, silent and loopable: they are
 * atmosphere, not content, and they autoplay muted.
 *
 * Resolution order, deliberately: video -> still image -> labelled slot.
 * The labelled slot is the honest-placeholder pattern this repo already uses
 * for room photography (design-verified 2.7, PROJECT_CONTEXT §7). It says what
 * is missing in visitor-facing language rather than showing a broken frame,
 * and callers that have an illustration should pass it as `poster` so the slot
 * never appears on a public surface that has something real to show.
 *
 * REDUCED MOTION: `autoPlay` is a mount-time attribute, so flipping a prop
 * later does not stop a video that is already playing. The effect below pauses
 * it directly and hands the visitor controls instead. It also listens for the
 * preference changing mid-session. Autoplaying video is exactly what
 * `prefers-reduced-motion` exists to stop, and design-verified 2.6 makes the
 * collapse non-optional rather than dial-gated.
 */
export function MediaSlot({
  video,
  poster,
  alt,
  label = "Footage coming soon",
  className = "",
  imageClassName = "",
  sizes = "100vw",
  priority = false,
}: {
  video?: string;
  poster?: string;
  alt: string;
  label?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
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
             stays up, which is a fine resting state — not worth surfacing. */
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

  if (poster) {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        <Image src={poster} alt={alt} fill sizes={sizes} priority={priority} className={imageClassName} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-border-subtle bg-surface-raised ${className}`}
    >
      <span className="tabular px-6 text-center text-xs text-text-secondary">{label}</span>
    </div>
  );
}
