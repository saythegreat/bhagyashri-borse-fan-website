"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { MediaItem } from "@/types";
import { fetchAllPublicMedia } from "@/lib/api";
import { getCategoryLabel } from "@/lib/mediaLabels";
import ImageCard from "@/components/gallery/ImageCard";
import Lightbox from "@/components/gallery/Lightbox";

export default function CategoryGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = (params?.category as string) || "all";

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      try {
        const res = await fetchAllPublicMedia();
        setMediaList(res.filter((item) => item.category === categoryParam));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Unable to load this category.");
      } finally {
        setLoading(false);
      }
    }
    loadCategory();
  }, [categoryParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-400 hover:text-gold-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Categories</span>
        </Link>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-gold-gradient capitalize">
          {getCategoryLabel(categoryParam)} Showcase
        </h1>
        <p className="text-xs sm:text-sm text-blush/70 font-editorial mt-1">
          Curated collection of authentic records under the &ldquo;{categoryParam}&rdquo; archive.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-burgundy-900/40 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-8 text-center text-sm text-blush/80">
          Category photos could not be loaded: {loadError}
        </p>
      ) : mediaList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaList.map((item) => (
            <ImageCard
              key={item.id}
              media={item}
              onSelect={(m) => setActiveMedia(m)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-burgundy-900/30 border border-gold-400/20 rounded-2xl">
          <p className="font-cinzel text-base text-ivory">No items in this category yet.</p>
        </div>
      )}

      {activeMedia && (
        <Lightbox
          media={activeMedia}
          items={mediaList}
          onClose={() => setActiveMedia(null)}
          onNavigate={(item) => setActiveMedia(item)}
        />
      )}
    </div>
  );
}
