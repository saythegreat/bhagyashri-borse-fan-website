"use client";

import { useEffect, useRef, useState } from "react";
import { VideoItem } from "@/types";
import { fetchLocalVideoPreview, fetchVideos, updateVideo } from "@/lib/api";

const VIDEO_CATEGORIES: Array<{ id: VideoItem["category"]; label: string }> = [
  { id: "trailers", label: "Trailers" },
  { id: "songs", label: "Songs & Dance" },
  { id: "interviews", label: "Interviews" },
  { id: "promotions", label: "Promotions" },
  { id: "lifestyle", label: "Behind the Scenes & Lifestyle" },
  { id: "reels", label: "Reels & Short Clips" },
  { id: "other", label: "Other" },
];

export default function LocalVideoReviewQueue() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<Record<number, VideoItem["category"]>>({});
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    fetchVideos({ provider: "local", review_status: "pending" })
      .then((items) => {
        if (active) {
          setVideos(items);
          setCategories(
            Object.fromEntries(items.map((item) => [item.id, item.category])),
          );
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load local videos for review.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const loadPreview = async (video: VideoItem) => {
    try {
      const url = await fetchLocalVideoPreview(video.video_id);
      previewUrls.current.add(url);
      setPreviews((current) => ({ ...current, [video.id]: url }));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load this video preview.");
    }
  };

  const saveReview = async (video: VideoItem, approve: boolean) => {
    try {
      await updateVideo(video.id, {
        category: categories[video.id] || "other",
        review_status: approve ? "approved" : "pending",
      });
      if (approve) {
        setVideos((current) => current.filter((item) => item.id !== video.id));
      }
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this video review.");
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gold-400/20 bg-burgundy-900/40 p-5">
      <div>
        <h2 className="font-cinzel text-base font-bold text-ivory">
          Local videos awaiting review
        </h2>
        <p className="mt-1 text-xs leading-5 text-blush/70">
          Uncertain clips stay private until a curator previews, categorizes, and approves them.
        </p>
      </div>
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      {loading ? (
        <p className="text-sm text-blush/60">Loading video review queue…</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-blush/60">No local videos need manual review.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((video) => (
            <article
              key={video.id}
              className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <p className="break-words text-sm font-semibold text-ivory">{video.title}</p>
              {previews[video.id] ? (
                <video
                  className="aspect-video w-full rounded-lg bg-black object-contain"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  src={previews[video.id]}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => loadPreview(video)}
                  className="rounded-full border border-gold-400/40 px-3 py-1.5 text-xs text-gold-200 hover:bg-gold-400/10"
                >
                  Load preview
                </button>
              )}
              <label className="block text-xs text-blush/70">
                Category
                <select
                  value={categories[video.id] || "other"}
                  onChange={(event) =>
                    setCategories((current) => ({
                      ...current,
                      [video.id]: event.target.value as VideoItem["category"],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gold-400/20 bg-burgundy-950 px-3 py-2 text-xs text-ivory"
                >
                  {VIDEO_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveReview(video, true)}
                  className="rounded-full bg-gold-400 px-4 py-2 text-xs font-bold text-burgundy-950 hover:bg-gold-300"
                >
                  Approve &amp; publish
                </button>
                <button
                  type="button"
                  onClick={() => saveReview(video, false)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs text-blush/80 hover:border-white/50"
                >
                  Save category
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
