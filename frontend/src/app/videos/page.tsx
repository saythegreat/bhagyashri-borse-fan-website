"use client";

import React, { useState, useEffect } from "react";
import { Heart, Play, Search, Video } from "lucide-react";
import { VideoItem } from "@/types";
import {
  fetchAllPublicMedia,
  fetchVideos,
  getMediaImageUrl,
} from "@/lib/api";
import { selectVideoPosters } from "@/lib/videoPosters";
import AutoplayVideo from "@/components/videos/AutoplayVideo";
import { getCategoryLabel, getVideoDisplayTitle } from "@/lib/mediaLabels";
import { getFavoriteVideoIds, toggleFavoriteVideo } from "@/lib/favorites";

// Excluded from public-facing collection as requested
const EXCLUDED_CATEGORIES = new Set([
  "trailers",
  "songs",
  "interviews",
  "official",
  "dance",
]);

// Valid active remaining categories
const VIDEO_CATEGORIES = [
  { id: "all", label: "All Videos" },
  { id: "lifestyle", label: "Behind the Scenes & Lifestyle" },
  { id: "reels", label: "Reels & Short Clips" },
  { id: "promotions", label: "Promotions & Announcements" },
];

function getEffectiveVideoCategory(video: VideoItem): string {
  if (EXCLUDED_CATEGORIES.has(video.category)) return "excluded";
  if (video.category === "other") return "reels";
  return video.category;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null);
  const [posterUrls, setPosterUrls] = useState<Map<number, string>>(new Map());
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    const updateFavs = () => setFavoriteIds(getFavoriteVideoIds());
    updateFavs();
    window.addEventListener("favorites-updated", updateFavs);
    return () => window.removeEventListener("favorites-updated", updateFavs);
  }, []);

  useEffect(() => {
    async function loadVideos() {
      setLoading(true);
      const [remoteResult, localResult, photosResult] = await Promise.allSettled([
        fetchVideos(),
        fetch("/api/local-videos").then(async (response) => {
          if (!response.ok) throw new Error(`Local videos returned ${response.status}`);
          return (await response.json()) as VideoItem[];
        }),
        fetchAllPublicMedia(),
      ]);

      const remoteVideos =
        remoteResult.status === "fulfilled"
          ? remoteResult.value.filter((v) => v.provider !== "local")
          : [];
      const localVideos =
        localResult.status === "fulfilled"
          ? localResult.value
          : [];

      // Deduplicate videos by ID to guarantee unique keys across providers
      const combinedVideos = [...localVideos, ...remoteVideos];
      const uniqueVideos = Array.from(
        new Map(combinedVideos.map((v) => [v.id, v])).values()
      );

      // Exclude unwanted categories from the public-facing video collection
      const publicVideos = uniqueVideos.filter(
        (v) => !EXCLUDED_CATEGORIES.has(v.category)
      );

      if (photosResult.status === "fulfilled") {
        const posters = selectVideoPosters(
          publicVideos,
          photosResult.value,
        );
        const posterPaths = new Map<number, string>();
        posters.forEach((media, videoId) => {
          posterPaths.set(videoId, getMediaImageUrl(media, true));
        });
        setPosterUrls(posterPaths);
      } else {
        setPosterUrls(new Map());
      }

      setVideos(publicVideos);

      if (remoteResult.status === "rejected" && localResult.status === "rejected") {
        setLoadError("The video library could not be reached.");
      } else if (
        remoteResult.status === "rejected" ||
        localResult.status === "rejected" ||
        photosResult.status === "rejected"
      ) {
        setLoadError("Some video sources are temporarily unavailable.");
      } else {
        setLoadError(null);
      }
      setLoading(false);
    }
    loadVideos();
  }, []);

  const handleToggleFavorite = (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteVideo(videoId);
  };

  const categoryCounts = videos.reduce<Record<string, number>>((counts, video) => {
    const cat = getEffectiveVideoCategory(video);
    counts[cat] = (counts[cat] || 0) + 1;
    return counts;
  }, {});

  const filteredVideos = videos.filter((v) => {
    const cat = getEffectiveVideoCategory(v);
    if (activeCategory !== "all" && cat !== activeCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const displayTitle = getVideoDisplayTitle(v).toLowerCase();
    return (
      displayTitle.includes(q) ||
      v.title.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-burgundy-800/80 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-widest shadow-gold">
          <Video className="w-3.5 h-3.5" />
          <span>Curated Video Archive</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-gold-gradient">
          Video Gallery
        </h1>
        <p className="text-xs sm:text-sm text-blush/80 leading-relaxed font-sans">
          Curated behind-the-scenes moments, fashion reels, and promotional highlights from the archive collection.
        </p>
      </div>

      {/* Category Pills & Search */}
      <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {VIDEO_CATEGORIES.filter(
            (cat) => cat.id === "all" || (categoryCounts[cat.id] ?? 0) > 0,
          ).map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = cat.id === "all" ? videos.length : (categoryCounts[cat.id] || 0);
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-gold-400 text-burgundy-900 font-bold shadow-gold scale-105"
                    : "bg-burgundy-900/80 text-blush/80 hover:text-ivory border border-gold-400/20"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title or category..."
            className="w-full bg-burgundy-950/80 border border-gold-400/30 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400 transition-colors"
          />
          <Search className="w-4 h-4 text-gold-400 absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-2xl bg-burgundy-900/40 animate-pulse" />
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const displayTitle = getVideoDisplayTitle(video);
            const isFav = favoriteIds.includes(video.id);
            const effectiveCategory = getEffectiveVideoCategory(video);

            return (
              <div
                key={video.id}
                onClick={video.provider === "local" ? undefined : () => setActiveModalVideo(video)}
                onKeyDown={(event) => {
                  if (
                    video.provider !== "local" &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    setActiveModalVideo(video);
                  }
                }}
                role={video.provider === "local" ? undefined : "button"}
                tabIndex={video.provider === "local" ? undefined : 0}
                className={`group rounded-2xl bg-burgundy-900/60 border border-gold-400/25 overflow-hidden hover:border-gold-400/60 transition-all duration-300 shadow-card hover:-translate-y-1 flex flex-col justify-between ${
                  video.provider === "local" ? "" : "cursor-pointer"
                }`}
              >
                <div className="relative w-full bg-black overflow-hidden">
                  {video.provider === "local" ? (
                    <AutoplayVideo
                      src={video.video_url}
                      title={displayTitle}
                      poster={video.thumbnail_url || posterUrls.get(video.id)}
                    />
                  ) : (
                    <>
                      <img
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`}
                        alt={displayTitle}
                        className="aspect-video w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gold-400 text-burgundy-900 flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-burgundy-900/90 text-gold-400 border border-gold-400/30 shadow-sm">
                      {getCategoryLabel(effectiveCategory)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(video.id, e)}
                      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                        isFav
                          ? "bg-rose-500 text-ivory shadow-gold scale-110"
                          : "bg-burgundy-900/70 text-ivory/70 hover:text-rose-400 hover:bg-burgundy-900/90"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel text-sm sm:text-base font-bold text-ivory line-clamp-2">
                      {displayTitle}
                    </h3>
                    {video.description && (
                      <p className="mt-1 text-xs text-blush/75 line-clamp-2 font-sans">
                        {video.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 text-[11px] text-gold-300 font-semibold flex items-center justify-between">
                    <span>{video.provider === "local" ? "Project archive video" : "Watch on YouTube"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-burgundy-900/30 border border-gold-400/20 rounded-2xl">
          <p className="font-cinzel text-lg font-bold text-ivory">No Videos Found</p>
          <p className="text-xs text-blush/70 mt-1">Try adjusting your search or category filter.</p>
        </div>
      )}
      {loadError && (
        <p role="status" className="text-center text-xs text-amber-200/80">{loadError}</p>
      )}

      {/* Video Modal Player */}
      {activeModalVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
          onClick={() => setActiveModalVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={getVideoDisplayTitle(activeModalVideo)}
        >
          <div
            className="w-full max-w-4xl bg-burgundy-900 border border-gold-400/30 rounded-3xl overflow-hidden shadow-cinematic"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-black">
              {/^[A-Za-z0-9_-]{11}$/.test(activeModalVideo.video_id) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeModalVideo.video_id}?autoplay=1&loop=1&playlist=${activeModalVideo.video_id}`}
                  title={getVideoDisplayTitle(activeModalVideo)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-ivory">
                  <p>This video does not have a playable embed ID.</p>
                  <a
                    href={activeModalVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-300 underline"
                  >
                    Open source video link
                  </a>
                </div>
              )}
            </div>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-burgundy-900/90 border-t border-gold-400/20">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">
                  {getCategoryLabel(getEffectiveVideoCategory(activeModalVideo))}
                </span>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-ivory">
                  {getVideoDisplayTitle(activeModalVideo)}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(activeModalVideo.id, e)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    favoriteIds.includes(activeModalVideo.id)
                      ? "bg-rose-500 border-rose-400 text-ivory"
                      : "border-gold-400/30 text-blush/80 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favoriteIds.includes(activeModalVideo.id) ? "fill-current" : ""}`} />
                  <span>Favorite</span>
                </button>
                <button
                  onClick={() => setActiveModalVideo(null)}
                  className="px-4 py-2 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-colors shadow-gold"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
