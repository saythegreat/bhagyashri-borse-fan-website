"use client";

import React from "react";
import { Search, RotateCcw, Filter, ArrowUpDown } from "lucide-react";
import { FilmLanguage, FilmStatus } from "@/data/filmography";

export type SortOption = "newest" | "oldest" | "alphabetical";

interface TimelineControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
  onReset: () => void;
}

const LANGUAGES: { id: string; label: string }[] = [
  { id: "all", label: "All Languages" },
  { id: "Hindi", label: "Hindi" },
  { id: "Telugu", label: "Telugu" },
  { id: "Tamil", label: "Tamil" },
  { id: "Other", label: "Other Languages" },
];

const STATUSES: { id: string; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "Released", label: "Released" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "To Be Confirmed", label: "To Be Confirmed" },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "alphabetical", label: "Alphabetical" },
];

export default function TimelineControls({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedStatus,
  onStatusChange,
  selectedSort,
  onSortChange,
  totalResults,
  onReset,
}: TimelineControlsProps) {
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedLanguage !== "all" ||
    selectedStatus !== "all" ||
    selectedSort !== "newest";

  return (
    <div className="bg-burgundy-900/60 border border-gold-400/25 rounded-3xl p-5 sm:p-7 backdrop-blur-md shadow-card space-y-5">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gold-400 absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by movie title (e.g. Mr. Bachchan, Kaantha, Lenin)..."
          className="w-full pl-11 pr-4 py-3 bg-burgundy-950/70 border border-gold-400/20 rounded-2xl text-xs sm:text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30 transition-all font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3.5 text-xs text-blush/60 hover:text-ivory px-2 py-1 rounded-lg bg-burgundy-800/80"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Language Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gold-400/90 font-cinzel flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-gold-400" />
            <span>Language</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => {
              const active = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => onLanguageChange(lang.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                    active
                      ? "bg-gold-400 text-burgundy-900 font-bold shadow-gold scale-105"
                      : "bg-burgundy-950/70 text-blush/80 hover:text-ivory hover:bg-white/5 border border-gold-400/20"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gold-400/90 font-cinzel flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-gold-400" />
            <span>Project Status</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((status) => {
              const active = selectedStatus === status.id;
              return (
                <button
                  key={status.id}
                  onClick={() => onStatusChange(status.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                    active
                      ? "bg-gold-400 text-burgundy-900 font-bold shadow-gold scale-105"
                      : "bg-burgundy-950/70 text-blush/80 hover:text-ivory hover:bg-white/5 border border-gold-400/20"
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sort & Results Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-400/15 text-xs">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-blush/70 font-sans">Sort by:</span>
          <div className="inline-flex rounded-xl bg-burgundy-950/70 p-0.5 border border-gold-400/20">
            {SORTS.map((sort) => {
              const active = selectedSort === sort.id;
              return (
                <button
                  key={sort.id}
                  onClick={() => onSortChange(sort.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    active
                      ? "bg-gold-400 text-burgundy-900 font-bold shadow-sm"
                      : "text-blush/70 hover:text-ivory"
                  }`}
                >
                  {sort.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gold-300 font-medium font-sans">
            Showing <strong className="text-ivory font-bold">{totalResults}</strong>{" "}
            {totalResults === 1 ? "project" : "projects"}
          </span>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-burgundy-800 text-rose-300 hover:text-ivory hover:bg-burgundy-700 transition-colors text-[11px] font-medium border border-rose-400/20"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

