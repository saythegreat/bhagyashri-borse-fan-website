"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  ExternalLink,
} from "lucide-react";
import { MediaItem } from "@/types";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { getCategoryLabel, getMediaDisplayTitle } from "@/lib/mediaLabels";
import { getMediaImageUrl } from "@/lib/api";
import MediaImage from "../ui/MediaImage";

interface LightboxProps {
  media: MediaItem | null;
  items: MediaItem[];
  onClose: () => void;
  onNavigate: (item: MediaItem) => void;
}

export default function Lightbox({ media, items, onClose, onNavigate }: LightboxProps) {
  const [favorite, setFavorite] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const currentIndex = media ? items.findIndex((item) => item.id === media.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(items[currentIndex - 1]);
  }, [currentIndex, items, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      onNavigate(items[currentIndex + 1]);
    }
  }, [currentIndex, items, onNavigate]);

  // Preload adjacent images
  useEffect(() => {
    if (currentIndex > 0) {
      const prev = items[currentIndex - 1];
      const img = new Image();
      img.src = getMediaImageUrl(prev);
    }
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      const next = items[currentIndex + 1];
      const img = new Image();
      img.src = getMediaImageUrl(next);
    }
  }, [currentIndex, items]);

  // Focus restoration & Escape / Arrow keys & Body lock
  useEffect(() => {
    if (!media) return;

    if (typeof document !== "undefined") {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Set initial focus to close button
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [media, handleNext, handlePrev, onClose]);

  useEffect(() => {
    if (!media) return;
    const updateFavorite = () => setFavorite(isFavorite(media.id));
    updateFavorite();
    window.addEventListener("favorites-updated", updateFavorite);
    return () => window.removeEventListener("favorites-updated", updateFavorite);
  }, [media]);

  if (!media) return null;

  const handleFav = () => {
    setFavorite(toggleFavorite(media.id));
  };
  const title = getMediaDisplayTitle(media);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cinema-dark/95 backdrop-blur-xl p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph Preview: ${title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header Bar: Counter & Close button */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-burgundy-900/90 text-gold-300 border border-gold-400/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-md">
          Photograph {currentIndex + 1} of {items.length}
        </div>

        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="pointer-events-auto p-2.5 rounded-full bg-burgundy-900/90 text-ivory border border-gold-400/30 hover:bg-gold-400 hover:text-burgundy-900 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
          aria-label="Close Lightbox (Press Escape)"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Navigation: Prev */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-burgundy-900/90 text-ivory border border-gold-400/30 hover:bg-gold-400 hover:text-burgundy-900 transition-all hidden sm:flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
          aria-label="Previous Photograph (Left arrow key)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Navigation: Next */}
      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-burgundy-900/90 text-ivory border border-gold-400/30 hover:bg-gold-400 hover:text-burgundy-900 transition-all hidden sm:flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
          aria-label="Next Photograph (Right arrow key)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Content Modal */}
      <div
        className="max-w-6xl w-full max-h-[88vh] bg-burgundy-900/90 border border-gold-400/30 rounded-3xl overflow-hidden shadow-cinematic flex flex-col lg:flex-row mt-12 sm:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Large Media Display */}
        <div className="flex-1 bg-black/75 flex items-center justify-center p-2 sm:p-4 min-h-[300px] lg:min-h-[520px] relative">
          <MediaImage
            media={media}
            alt={title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
          />

          {/* Mobile Prev/Next Overlay Controls */}
          <div className="sm:hidden absolute inset-x-2 bottom-2 flex justify-between pointer-events-none">
            {hasPrev ? (
              <button
                onClick={handlePrev}
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-burgundy-900/80 text-ivory border border-gold-400/30 text-xs font-semibold flex items-center gap-1 shadow-md"
                aria-label="Previous Image"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
            ) : <div />}

            {hasNext ? (
              <button
                onClick={handleNext}
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-burgundy-900/80 text-ivory border border-gold-400/30 text-xs font-semibold flex items-center gap-1 shadow-md"
                aria-label="Next Image"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-96 p-5 sm:p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gold-400/20 bg-burgundy-900/95 overflow-y-auto max-h-[40vh] lg:max-h-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gold-400/15 text-gold-400 border border-gold-400/30 rounded-full">
                {getCategoryLabel(media.category)}
              </span>
              <button
                onClick={handleFav}
                type="button"
                className={`p-2 rounded-full border transition-all ${
                  favorite
                    ? "bg-rose-500 border-rose-400 text-ivory scale-105"
                    : "border-gold-400/30 text-blush/70 hover:text-rose-400"
                }`}
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`w-5 h-5 ${favorite ? "fill-current" : ""}`} />
              </button>
            </div>

            <div>
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-ivory leading-snug">
                {title}
              </h2>
              {media.description && (
                <p className="mt-2 text-xs text-blush/80 leading-relaxed font-sans">
                  {media.description}
                </p>
              )}
            </div>

            {/* Metadata Badges */}
            <div className="space-y-2.5 pt-4 border-t border-gold-400/15 text-xs text-blush/80">
              <div className="flex items-center justify-between">
                <span className="text-blush/60">Source Provider:</span>
                <span className="font-semibold text-gold-300 truncate max-w-[180px]">
                  {media.source_name || "Project Archive"}
                </span>
              </div>

              {media.width && media.height && (
                <div className="flex items-center justify-between">
                  <span className="text-blush/60">Dimensions:</span>
                  <span>{media.width} &times; {media.height} px</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-blush/60">License / Rights:</span>
                <span className="truncate max-w-[170px] text-right font-medium">
                  {media.license_name || "Fair Use Fan Editorial"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-blush/60">Archive Status:</span>
                <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-white/5 border border-white/10 text-gold-300">
                  {media.reuse_status || "Curated"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-5 mt-5 border-t border-gold-400/20 space-y-3">
            {media.source_url && (
              <a
                href={media.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gold-400 text-burgundy-900 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-gold-300 transition-colors shadow-gold"
              >
                <span>Inspect Source Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="text-[11px] text-blush/50 text-center font-sans">
              Unofficial fan curation &bull; Image {currentIndex + 1} of {items.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
