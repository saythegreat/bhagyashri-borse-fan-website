"use client";

import { useState } from "react";

interface HomeHeroVideoProps {
  src: string;
  poster: string;
}

export default function HomeHeroVideo({ src, poster }: HomeHeroVideoProps) {
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const handlePlaybackFailure = () => setPlaybackFailed(true);

  if (playbackFailed) return null;

  return (
    <video
      aria-hidden="true"
      autoPlay
      className="home-hero-video absolute inset-0 h-full w-full object-cover"
      loop
      muted
      playsInline
      poster={poster}
      preload="metadata"
      tabIndex={-1}
      onError={handlePlaybackFailure}
    >
      <source src={src} type="video/mp4" onError={handlePlaybackFailure} />
    </video>
  );
}
