"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal HLS player for Cloudflare Stream signed manifests.
 * Safari plays HLS natively; everywhere else uses hls.js.
 */
export function StreamPlayer({
  src,
  poster,
  autoPlay = false,
  className,
  onEnded,
}: {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      if (autoPlay) void video.play().catch(() => {});
      return;
    }

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !videoRef.current) return;
      if (Hls.isSupported()) {
        const instance = new Hls();
        instance.loadSource(src);
        instance.attachMedia(videoRef.current);
        if (autoPlay) {
          instance.on(Hls.Events.MANIFEST_PARSED, () => {
            void videoRef.current?.play().catch(() => {});
          });
        }
        hls = instance;
      } else {
        videoRef.current.src = src;
      }
    });
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      onEnded={onEnded}
      className={className}
    />
  );
}
