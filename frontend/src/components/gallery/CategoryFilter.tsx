"use client";

import React from "react";
import { MediaItem } from "@/types";
import { getCategoryLabel } from "@/lib/mediaLabels";

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  media: MediaItem[];
}

const CATEGORIES = [
  { id: "all", label: "All Works" },
  { id: "beauty-queen", label: "Beauty Queen" },
  { id: "portraits", label: "Portraits" },
  { id: "traditional", label: "Traditional" },
  { id: "photoshoots", label: "Photoshoots" },
  { id: "lenin", label: "Lenin" },
  { id: "mr-bachchan", label: "Mr. Bachchan" },
  { id: "yaariyan-2", label: "Yaariyan 2" },
  { id: "chandu-champion", label: "Chandu Champion" },
  { id: "promotions", label: "Film Promotions" },
  { id: "events", label: "Public Events" },
  { id: "casual", label: "Casual & Travel" },
  { id: "other", label: "Other" },
];

export default function CategoryFilter({
  activeCategory,
  onSelectCategory,
  media,
}: CategoryFilterProps) {
  const counts = media.reduce<Record<string, number>>((result, item) => {
    result[item.category] = (result[item.category] || 0) + 1;
    return result;
  }, {});

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1">
      {CATEGORIES.filter((cat) => cat.id === "all" || counts[cat.id] > 0).map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "bg-gold-400 text-burgundy-900 font-bold shadow-gold scale-105"
                : "bg-burgundy-900/70 text-blush/80 hover:text-ivory hover:bg-burgundy-800 border border-gold-400/20"
            }`}
          >
            {getCategoryLabel(cat.label)} <span className="ml-1 opacity-70">({cat.id === "all" ? media.length : counts[cat.id] || 0})</span>
          </button>
        );
      })}
    </div>
  );
}
