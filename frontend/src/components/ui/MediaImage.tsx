"use client";

import { useEffect, useState } from "react";
import { getMediaImageUrl, getToken } from "@/lib/api";
import { MediaItem } from "@/types";

interface MediaImageProps {
  media: MediaItem;
  alt: string;
  thumbnail?: boolean;
  className?: string;
  loading?: "eager" | "lazy";
}

export default function MediaImage({
  media,
  alt,
  thumbnail = false,
  className = "",
  loading = "lazy",
}: MediaImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setSrc(null);
    setFailed(false);

    const imageUrl = getMediaImageUrl(media, thumbnail);
    const token = getToken();
    if (!media.local_path || !token) {
      setSrc(imageUrl);
    } else {
      fetch(imageUrl, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (response) => {
          if (!response.ok && media.review_status === "approved") {
            response = await fetch(imageUrl);
          }
          if (!response.ok) {
            throw new Error(`Image request failed (HTTP ${response.status})`);
          }
          return response.blob();
        })
        .then((blob) => {
          if (!active) return;
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    }

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.id, media.local_path, media.direct_image_url, thumbnail]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (unavailable)`}
        className={`flex items-center justify-center bg-burgundy-950 text-center text-xs text-blush/70 ${className}`}
      >
        Image unavailable
      </div>
    );
  }

  if (!src) {
    return <div aria-hidden="true" className={`animate-pulse bg-burgundy-900/30 ${className}`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
