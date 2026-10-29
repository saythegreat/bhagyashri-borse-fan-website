"use client";

import { useEffect, useRef, useState } from "react";
import { pauseAllOtherVideos, pauseQueuedVideo, queueVisibleVideo } from "@/lib/autoplayVideoQueue";

interface AutoplayVideoProps {
  src: string;
  title: string;
  poster?: string;
}

export default function AutoplayVideo({ src, title, poster }: AutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoplayGranted, setAutoplayGranted] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldPlay = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        setIsVisible(shouldPlay);
        if (shouldPlay) {
          video.muted = true;
          queueVisibleVideo(
            video,
            () => setAutoplayBlocked(true),
            setAutoplayGranted,
          );
        } else {
          pauseQueuedVideo(video);
        }
      },
      { threshold: [0, 0.6, 1], rootMargin: "0px" },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      pauseQueuedVideo(video);
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: isPortrait ? "3 / 4" : "16 / 9" }}
    >
      {poster && !hasFrame && !loadError && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      )}
      <video
        ref={videoRef}
        controls
        muted
        autoPlay={autoplayGranted}
        loop
        playsInline
        preload={isVisible ? "auto" : "none"}
        poster={poster}
        aria-label={title}
        className="relative z-[1] h-full w-full bg-black object-contain"
        onLoadedMetadata={(event) => {
          const { videoWidth, videoHeight } = event.currentTarget;
          setIsPortrait(videoHeight > videoWidth);
        }}
        onLoadedData={() => {
          setHasFrame(true);
          setLoadError(false);
        }}
        onPlay={(event) => {
          setAutoplayBlocked(false);
          setHasFrame(true);
          pauseAllOtherVideos(event.currentTarget);
        }}
        onPause={() => {
          const video = videoRef.current;
          if (video && !video.ended) pauseQueuedVideo(video);
        }}
        onError={(event) => {
          setLoadError(true);
          pauseQueuedVideo(event.currentTarget);
        }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support embedded videos.
      </video>
      {loadError && (
        <p
          role="status"
          className="absolute inset-0 z-[2] flex items-center justify-center bg-black/80 px-5 text-center text-sm text-blush/80"
        >
          This video could not be loaded.
        </p>
      )}
      {autoplayBlocked && !loadError && (
        <p className="pointer-events-none absolute left-3 top-3 z-[2] rounded-full bg-black/70 px-3 py-1 text-[10px] text-white">
          Press play to watch
        </p>
      )}
    </div>
  );
}
