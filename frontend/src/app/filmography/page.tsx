"use client";

import React, { useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";
import { FILMOGRAPHY_DATA, FilmEntry } from "@/data/filmography";
import TimelineControls, { SortOption } from "@/components/filmography/TimelineControls";
import FilmographyTimeline from "@/components/filmography/FilmographyTimeline";

export default function FilmographyPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>("newest");

  // Filter and sort entries client-side without page reloads
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matches = FILMOGRAPHY_DATA.filter((entry: FilmEntry) => {
      // Search matching
      const matchesSearch = !query || entry.title.toLowerCase().includes(query);

      // Language matching
      let matchesLanguage = true;
      if (selectedLanguage !== "all") {
        if (selectedLanguage === "Other") {
          matchesLanguage = !["Hindi", "Telugu", "Tamil"].includes(entry.language);
        } else {
          matchesLanguage = entry.language === selectedLanguage;
        }
      }

      // Status matching
      const matchesStatus =
        selectedStatus === "all" || entry.status === selectedStatus;

      return matchesSearch && matchesLanguage && matchesStatus;
    });

    // Sort entries
    return matches.sort((a, b) => {
      if (selectedSort === "newest") {
        return b.year - a.year || a.title.localeCompare(b.title);
      }
      if (selectedSort === "oldest") {
        return a.year - b.year || a.title.localeCompare(b.title);
      }
      if (selectedSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [searchQuery, selectedLanguage, selectedStatus, selectedSort]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLanguage("all");
    setSelectedStatus("all");
    setSelectedSort("newest");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Cinematic Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-burgundy-800/80 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-widest shadow-gold">
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Cinematic Timeline</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-gold-gradient">
          Filmography & Screen Journey
        </h1>
        <p className="text-xs sm:text-sm text-blush/80 leading-relaxed font-sans">
          An interactive, chronological chronicle celebrating Bhagyashri Borse&apos;s cinematic journey across
          Hindi, Telugu, and Tamil cinema. Explore verified roles, release milestones, and upcoming features.
        </p>
      </div>

      {/* Interactive Controls (Search, Language, Status, Sorting) */}
      <TimelineControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        totalResults={filteredEntries.length}
        onReset={handleResetFilters}
      />

      {/* Cinematic Vertical Timeline */}
      <FilmographyTimeline entries={filteredEntries} />
    </div>
  );
}
