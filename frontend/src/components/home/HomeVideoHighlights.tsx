"use client";

import { useEffect, useState } from "react";
import { Heart, Play } from "lucide-react";
import { fetchAllPublicMedia, getMediaImageUrl } from "@/lib/api";
import { VideoItem, MediaItem } from "@/types";
import { selectVideoPosters } from "@/lib/videoPosters";
import AutoplayVideo from "@/components/videos/AutoplayVideo";
import { getVideoDisplayTitle } from "@/lib/mediaLabels";
import { getFavoriteVideoIds, toggleFavoriteVideo } from "@/lib/favorites";

const EXCLUDED_CATEGORIES = new Set([
  "trailers",
  "songs",
  "interviews",
  "official",
  "dance",
]);

const FEATURED_TITLE_HINTS = [
  "Brown is my colour",
  "Behind the scenes",
  "ITS SUNDAY",
  "Stealing the best caption",
];

export default function HomeVideoHighlights() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [posters, setPosters] = useState<Map<number, MediaItem>>(new Map());
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateFavs = () => setFavoriteIds(getFavoriteVideoIds());
    updateFavs();
    window.addEventListener("favorites-updated", updateFavs);
    return () => window.removeEventListener("favorites-updated", updateFavs);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/local-videos").then(async (response) => {
        if (!response.ok) throw new Error(`Local videos returned ${response.status}`);
        return (await response.json()) as VideoItem[];
      }),
      fetchAllPublicMedia(),
    ])
      .then(([availableVideos, photos]) => {
        if (!active) return;
        const validVideos = availableVideos.filter(
          (v) => !EXCLUDED_CATEGORIES.has(v.category),
        );
        const featured = FEATURED_TITLE_HINTS.map((hint) =>
          validVideos.find((video) =>
            video.title.toLowerCase().includes(hint.toLowerCase()),
          ),
        ).filter((video): video is VideoItem => Boolean(video));
        // If hints didn't match 4, fill up with other available videos
        if (featured.length < 4 && validVideos.length > 0) {
          for (const v of validVideos) {
            if (featured.length >= 4) break;
            if (!featured.some((existing) => existing.id === v.id)) {
              featured.push(v);
            }
          }
        }
        setVideos(featured);
        setPosters(selectVideoPosters(featured, photos));
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to load video highlights.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p role="alert" className="text-sm text-[#e8d8c5]/75">{error}</p>;
  }
  if (videos.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {videos.map((video) => {
        const poster = posters.get(video.id);
        const displayTitle = getVideoDisplayTitle(video);
        const isFav = favoriteIds.includes(video.id);

        return (
          <article
            key={video.id}
            className="home-video-card overflow-hidden rounded-xl border border-gold-400/20 bg-burgundy-900/60 shadow-card hover:border-gold-400/40 transition-colors"
          >
            <AutoplayVideo
              src={video.video_url}
              title={displayTitle}
              poster={
                video.thumbnail_url ||
                (poster ? getMediaImageUrl(poster, true) : undefined)
              }
            />
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-burgundy-950/60">
              <p className="truncate font-editorial text-sm text-[#f6ead9]">
                {displayTitle}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavoriteVideo(video.id)}
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                  className={`p-1 rounded-full transition-colors ${
                    isFav ? "text-rose-400" : "text-gold-300 hover:text-rose-400"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
