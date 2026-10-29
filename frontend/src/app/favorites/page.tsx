"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Trash2, ArrowRight, Image as ImageIcon, Video as VideoIcon, Play } from "lucide-react";
import { MediaItem, VideoItem } from "@/types";
import { fetchAllPublicMedia, fetchVideos, getMediaImageUrl } from "@/lib/api";
import {
  getFavoriteIds,
  pruneFavoriteIds,
  getFavoriteVideoIds,
  pruneFavoriteVideoIds,
  toggleFavoriteVideo,
} from "@/lib/favorites";
import ImageCard from "@/components/gallery/ImageCard";
import Lightbox from "@/components/gallery/Lightbox";
import AutoplayVideo from "@/components/videos/AutoplayVideo";
import { getCategoryLabel, getVideoDisplayTitle } from "@/lib/mediaLabels";
import { selectVideoPosters } from "@/lib/videoPosters";

const EXCLUDED_CATEGORIES = new Set([
  "trailers",
  "songs",
  "interviews",
  "official",
  "dance",
]);

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<"photos" | "videos">("photos");
  const [favoriteMedia, setFavoriteMedia] = useState<MediaItem[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<VideoItem[]>([]);
  const [posterUrls, setPosterUrls] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    let active = true;
    let handleUpdate: (() => void) | undefined;

    async function loadAllFavorites() {
      try {
        const [photos, remoteVideosRes, localVideosRes] = await Promise.allSettled([
          fetchAllPublicMedia(),
          fetchVideos(),
          fetch("/api/local-videos").then(async (res) => {
            if (!res.ok) throw new Error("Local videos failed");
            return (await res.json()) as VideoItem[];
          }),
        ]);

        if (!active) return;

        const allPhotos = photos.status === "fulfilled" ? photos.value : [];
        const remoteVids =
          remoteVideosRes.status === "fulfilled"
            ? remoteVideosRes.value.filter((v) => v.provider !== "local")
            : [];
        const localVids =
          localVideosRes.status === "fulfilled" ? localVideosRes.value : [];

        const allVideosMap = new Map<number, VideoItem>();
        [...localVids, ...remoteVids].forEach((v) => allVideosMap.set(v.id, v));
        const allVideos = Array.from(allVideosMap.values()).filter(
          (v) => !EXCLUDED_CATEGORIES.has(v.category)
        );

        // Posters for local videos
        const posters = selectVideoPosters(localVids, allPhotos);
        const posterMap = new Map<number, string>();
        posters.forEach((media, vidId) => {
          posterMap.set(vidId, getMediaImageUrl(media, true));
        });
        setPosterUrls(posterMap);

        // Pruning invalid IDs from localStorage
        pruneFavoriteIds(allPhotos.map((p) => p.id));
        pruneFavoriteVideoIds(allVideos.map((v) => v.id));

        const updateFavorites = () => {
          const photoFavs = new Set(getFavoriteIds());
          const videoFavs = new Set(getFavoriteVideoIds());

          const currentFavPhotos = allPhotos.filter((p) => photoFavs.has(p.id));
          const currentFavVideos = allVideos.filter((v) => videoFavs.has(v.id));

          setFavoriteMedia(currentFavPhotos);
          setFavoriteVideos(currentFavVideos);
        };

        handleUpdate = updateFavorites;
        updateFavorites();
        window.addEventListener("favorites-updated", updateFavorites);
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Unable to load saved favorites.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAllFavorites();

    return () => {
      active = false;
      if (handleUpdate) window.removeEventListener("favorites-updated", handleUpdate);
    };
  }, []);

  const handleClearCurrentTab = () => {
    if (typeof window === "undefined") return;
    if (activeTab === "photos") {
      localStorage.removeItem("bhagya_fan_favorites");
    } else {
      localStorage.removeItem("bhagya_fan_video_favorites");
    }
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const currentCount =
    activeTab === "photos" ? favoriteMedia.length : favoriteVideos.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-400/20 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-widest mb-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Personal Fan Collection</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-gold-gradient">
            Your Saved Favorites
          </h1>
          <p className="text-xs sm:text-sm text-blush/75 font-sans mt-1">
            Privately stored on this device. Bookmark photos and video clips to view together anytime.
          </p>
        </div>

        {currentCount > 0 && (
          <button
            onClick={handleClearCurrentTab}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-burgundy-900 border border-rose-400/30 text-rose-300 text-xs font-semibold hover:bg-rose-500 hover:text-ivory transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              Clear {activeTab === "photos" ? "Photographs" : "Videos"} ({currentCount})
            </span>
          </button>
        )}
      </div>

      {/* Media Type Tabs */}
      <div className="flex items-center gap-3 border-b border-gold-400/15 pb-4">
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "photos"
              ? "bg-gold-400 text-burgundy-900 font-bold shadow-gold scale-105"
              : "bg-burgundy-900/60 text-blush/75 hover:text-ivory border border-gold-400/20"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photographs</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
            {favoriteMedia.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "videos"
              ? "bg-gold-400 text-burgundy-900 font-bold shadow-gold scale-105"
              : "bg-burgundy-900/60 text-blush/75 hover:text-ivory border border-gold-400/20"
          }`}
        >
          <VideoIcon className="w-4 h-4" />
          <span>Videos</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
            {favoriteVideos.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      {loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-8 text-center text-sm text-blush/80"
        >
          Favorites could not be loaded: {loadError}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl bg-burgundy-900/40 animate-pulse"
            />
          ))}
        </div>
      ) : activeTab === "photos" ? (
        favoriteMedia.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteMedia.map((item) => (
              <ImageCard
                key={item.id}
                media={item}
                onSelect={(m) => setActiveMedia(m)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-burgundy-900/40 border border-gold-400/20 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-burgundy-800 border border-gold-400/30 flex items-center justify-center text-rose-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-ivory">
              No Favorite Photographs Yet
            </h3>
            <p className="text-xs sm:text-sm text-blush/75 font-sans leading-relaxed">
              Explore the curated gallery and click the heart icon on any photo to save it here for quick access.
            </p>
            <div className="pt-2">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-colors shadow-gold"
              >
                <span>Browse Photo Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )
      ) : favoriteVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteVideos.map((video) => {
            const displayTitle = getVideoDisplayTitle(video);

            return (
              <div
                key={video.id}
                onClick={
                  video.provider === "local"
                    ? undefined
                    : () => setActiveModalVideo(video)
                }
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
                        src={
                          video.thumbnail_url ||
                          `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`
                        }
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

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-burgundy-900/90 text-gold-400 border border-gold-400/30">
                      {getCategoryLabel(video.category === "other" ? "reels" : video.category)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteVideo(video.id);
                      }}
                      aria-label="Remove video from favorites"
                      className="pointer-events-auto p-1.5 rounded-full bg-rose-500 text-ivory shadow-gold scale-110"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
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
                    <span>
                      {video.provider === "local"
                        ? "Project archive video"
                        : "Watch on YouTube"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-burgundy-900/40 border border-gold-400/20 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-burgundy-800 border border-gold-400/30 flex items-center justify-center text-rose-400">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-cinzel text-xl font-bold text-ivory">
            No Favorite Videos Yet
          </h3>
          <p className="text-xs sm:text-sm text-blush/75 font-sans leading-relaxed">
            Head to the video gallery and click the heart on any clip to bookmark your favorite reels and trailers.
          </p>
          <div className="pt-2">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-colors shadow-gold"
            >
              <span>Explore Video Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Lightbox for Photos */}
      {activeMedia && (
        <Lightbox
          media={activeMedia}
          items={favoriteMedia}
          onClose={() => setActiveMedia(null)}
          onNavigate={(item) => setActiveMedia(item)}
        />
      )}

      {/* Modal for YouTube Videos */}
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
                  {getCategoryLabel(activeModalVideo.category === "other" ? "reels" : activeModalVideo.category)}
                </span>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-ivory">
                  {getVideoDisplayTitle(activeModalVideo)}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleFavoriteVideo(activeModalVideo.id)}
                  className="px-3 py-2 rounded-xl bg-rose-500 text-ivory border border-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Favorited</span>
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
