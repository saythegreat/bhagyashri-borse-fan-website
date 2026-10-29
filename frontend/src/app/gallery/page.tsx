"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaItem } from "@/types";
import { fetchAllPublicMedia } from "@/lib/api";
import { pruneFavoriteIds } from "@/lib/favorites";
import { getCategoryLabel, getMediaDisplayTitle } from "@/lib/mediaLabels";
import ImageCard from "@/components/gallery/ImageCard";
import Lightbox from "@/components/gallery/Lightbox";
import CategoryFilter from "@/components/gallery/CategoryFilter";

function GalleryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "all";

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  // Sync category state when URL changes
  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    fetchAllPublicMedia()
      .then((items) => {
        if (!active) return;
        setMediaList(items);
        pruneFavoriteIds(items.map((item) => item.id));
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Unable to load the gallery.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mediaList.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const searchable = [
        getMediaDisplayTitle(item),
        item.description,
        getCategoryLabel(item.category),
        item.tags,
        item.source_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [activeCategory, mediaList, searchQuery]);

  const pageSize = 18;
  const totalCount = filteredMedia.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const visibleMedia = filteredMedia.slice((page - 1) * pageSize, page * pageSize);

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (cat === "all") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    const newQuery = params.toString();
    const newPath = newQuery ? `/gallery?${newQuery}` : "/gallery";
    router.replace(newPath, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-burgundy-800/80 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-widest shadow-gold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Gallery</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-gold-gradient">
          Portraits &amp; Visual Moments
        </h1>
        <p className="text-xs sm:text-sm text-blush/80 leading-relaxed font-sans">
          A dedicated archive of portraits, film moments, public appearances, and editorials featuring
          Bhagyashri Borse. Only approved media is showcased.
        </p>
      </div>

      {/* Controls Bar: Category Filters & Search */}
      <div className="space-y-4 bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
          media={mediaList}
        />

        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, category, or occasion..."
            className="w-full bg-burgundy-950/80 border border-gold-400/30 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400 transition-colors"
          />
          <Search className="w-4 h-4 text-gold-400 absolute left-3.5 pointer-events-none" />
          <span className="absolute right-3 text-xs text-gold-300">
            {totalCount} {totalCount === 1 ? "photograph" : "photographs"}
          </span>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[3/4] rounded-2xl bg-burgundy-900/40 border border-gold-400/10 animate-pulse"
            />
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-8 text-center">
          <p className="font-cinzel text-lg font-bold text-ivory">Gallery unavailable</p>
          <p className="mt-2 text-sm text-blush/80">{loadError}</p>
          <p className="mt-2 text-xs text-blush/60">Please check the media service and refresh this page.</p>
        </div>
      ) : visibleMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleMedia.map((item, idx) => (
            <ImageCard
              key={item.id}
              media={item}
              priority={idx < 4}
              onSelect={(m) => setActiveMedia(m)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-burgundy-900/30 border border-gold-400/20 rounded-2xl space-y-3">
          <p className="font-cinzel text-lg text-ivory font-bold">No Photographs Found</p>
          <p className="text-xs text-blush/70 font-sans">
            Try adjusting your search query or selecting a different category.
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-burgundy-800 text-ivory border border-gold-400/20 disabled:opacity-40 hover:bg-gold-400 hover:text-burgundy-900 transition-colors"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-blush font-cinzel">
            Page {page} of {totalPages} ({totalCount} photos)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-burgundy-800 text-ivory border border-gold-400/20 disabled:opacity-40 hover:bg-gold-400 hover:text-burgundy-900 transition-colors"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeMedia && (
        <Lightbox
          media={activeMedia}
          items={filteredMedia}
          onClose={() => setActiveMedia(null)}
          onNavigate={(item) => setActiveMedia(item)}
        />
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-blush/60">
          Loading archive gallery...
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
