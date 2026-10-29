"use client";

import React, { useState, useEffect } from "react";
import { Heart, ExternalLink, Maximize2 } from "lucide-react";
import { MediaItem } from "@/types";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { getCategoryLabel, getMediaDisplayTitle } from "@/lib/mediaLabels";
import MediaImage from "../ui/MediaImage";

interface ImageCardProps {
  media: MediaItem;
  onSelect: (media: MediaItem) => void;
  priority?: boolean;
}

export default function ImageCard({ media, onSelect, priority = false }: ImageCardProps) {
  const [favorite, setFavorite] = useState(false);
  const title = getMediaDisplayTitle(media);

  useEffect(() => {
    const updateFavorite = () => setFavorite(isFavorite(media.id));
    updateFavorite();
    window.addEventListener("favorites-updated", updateFavorite);
    return () => window.removeEventListener("favorites-updated", updateFavorite);
  }, [media.id]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavorite(media.id);
    setFavorite(updated);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onClick={() => onSelect(media)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(media);
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all duration-300 shadow-card hover:shadow-cinematic hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-burgundy-950">
        <MediaImage
            media={media}
            thumbnail
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-dark via-transparent to-black/30 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-burgundy-900/80 backdrop-blur-md text-gold-400 border border-gold-400/30 rounded-full shadow-sm">
            {getCategoryLabel(media.category)}
          </span>
          <button
            onClick={handleToggleFavorite}
            type="button"
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
              favorite
                ? "bg-rose-500 text-ivory shadow-gold scale-110"
                : "bg-burgundy-900/60 text-ivory/70 hover:text-rose-400 hover:bg-burgundy-900/90"
            }`}
          >
            <Heart className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 translate-y-1 group-hover:translate-y-0 transition-transform">
          <h3 className="font-cinzel text-sm sm:text-base font-bold text-ivory line-clamp-1 drop-shadow-md">
            {title}
          </h3>
          <div className="mt-1 flex items-center justify-between text-[11px] text-blush/80">
            <span className="truncate max-w-[140px] text-gold-300">
              {media.source_name}
            </span>
            {media.source_url ? (
              <a
                href={media.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                aria-label={`Open original source for ${media.title}`}
                className="p-1 text-gold-300 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-gold-400">
                <span>View</span>
                <Maximize2 className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
