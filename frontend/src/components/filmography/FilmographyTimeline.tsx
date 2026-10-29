"use client";

import React from "react";
import Link from "next/link";
import {
  Film,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Users,
  Clapperboard,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { FilmEntry } from "@/data/filmography";

interface FilmographyTimelineProps {
  entries: FilmEntry[];
}

export default function FilmographyTimeline({ entries }: FilmographyTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-burgundy-900/30 border border-gold-400/20 rounded-3xl space-y-3">
        <Film className="w-10 h-10 text-gold-400/60 mx-auto" />
        <h3 className="font-cinzel text-lg font-bold text-ivory">No Projects Found</h3>
        <p className="text-xs sm:text-sm text-blush/70 font-sans max-w-md mx-auto">
          No filmography entries match the selected filters. Try adjusting your search query, language, or status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="relative py-8">
      {/* Central Timeline Vertical Gold Line (Desktop: center, Mobile: left-aligned) */}
      <div
        className="absolute top-4 bottom-4 left-4 md:left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-gold-400/80 via-gold-400/40 to-gold-400/10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="space-y-10 md:space-y-16">
        {entries.map((entry, index) => {
          const isEven = index % 2 === 0;

          // Status Badge styling
          const statusConfig = {
            Released: {
              icon: CheckCircle2,
              badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-400/30",
              dotClass: "bg-gold-400 shadow-[0_0_15px_rgba(216,183,121,0.8)]",
            },
            Upcoming: {
              icon: Clock,
              badgeClass: "bg-amber-950/80 text-amber-300 border-amber-400/30",
              dotClass: "bg-rose-400 shadow-[0_0_15px_rgba(233,168,183,0.8)]",
            },
            "To Be Confirmed": {
              icon: HelpCircle,
              badgeClass: "bg-burgundy-950/80 text-rose-300 border-rose-400/30",
              dotClass: "bg-ivory shadow-[0_0_15px_rgba(255,248,240,0.8)]",
            },
          }[entry.status];

          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={entry.id}
              className={`relative flex flex-col md:flex-row items-start md:items-center ${
                isEven ? "md:flex-row-reverse" : ""
              } group transition-all duration-300`}
            >
              {/* Timeline Center Node Marker */}
              <div
                className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300"
                aria-hidden="true"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 border-burgundy-950 ${statusConfig.dotClass} group-hover:ring-4 group-hover:ring-gold-400/40 transition-all`}
                />
              </div>

              {/* Year Stamp for Desktop (on opposite side of the card) */}
              <div
                className={`hidden md:block w-1/2 ${
                  isEven ? "pr-12 text-right" : "pl-12 text-left"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy-900/60 border border-gold-400/20 text-gold-400 text-xs font-bold font-cinzel tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-gold-400" />
                  <span>{entry.displayYear}</span>
                </div>
              </div>

              {/* Card Container (pl-10 for mobile line offset; w-full md:w-1/2 on desktop) */}
              <div
                className={`w-full pl-10 md:pl-0 md:w-1/2 ${
                  isEven ? "md:pl-12" : "md:pr-12"
                }`}
              >
                <div className="bg-burgundy-900/70 border border-gold-400/25 rounded-3xl p-6 sm:p-7 backdrop-blur-md shadow-card hover:border-gold-400/60 hover:shadow-gold transition-all duration-300 space-y-4 relative overflow-hidden group-hover:-translate-y-1">
                  {/* Subtle decorative background accent */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 bg-gold-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-gold-400/10 transition-colors"
                    aria-hidden="true"
                  />

                  {/* Header Row: Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Pink Language Badge (per specification) */}
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">
                        {entry.language}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeClass}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{entry.status}</span>
                      </span>
                    </div>

                    {/* Mobile Year Badge */}
                    <span className="md:hidden text-xs font-bold font-cinzel text-gold-400 bg-burgundy-950/80 px-2.5 py-0.5 rounded-full border border-gold-400/20">
                      {entry.displayYear}
                    </span>
                  </div>

                  {/* Title & Role */}
                  <div className="space-y-1">
                    <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory group-hover:text-gold-gradient transition-colors">
                      {entry.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gold-300/90 font-medium font-sans">
                      <span className="text-blush/60">Role:</span> {entry.role}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-blush/85 leading-relaxed font-sans border-t border-gold-400/10 pt-3">
                    {entry.description}
                  </p>

                  {/* Director & Cast Info */}
                  {(entry.director || (entry.cast && entry.cast.length > 0)) && (
                    <div className="space-y-1.5 text-xs text-blush/75 bg-burgundy-950/50 p-3.5 rounded-2xl border border-gold-400/15 font-sans">
                      {entry.director && (
                        <div className="flex items-center gap-1.5">
                          <Clapperboard className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                          <span>
                            <strong className="text-ivory font-semibold">Direction:</strong>{" "}
                            {entry.director}
                          </span>
                        </div>
                      )}
                      {entry.cast && entry.cast.length > 0 && (
                        <div className="flex items-start gap-1.5 pt-0.5">
                          <Users className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-ivory font-semibold">Key Cast:</strong>{" "}
                            {entry.cast.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Highlights Tags */}
                  {entry.highlights && entry.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.highlights.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-burgundy-800/60 text-blush/80 border border-gold-400/10"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-gold-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Optional Dedicated Tribute Link */}
                  {entry.pageUrl && (
                    <div className="pt-2 border-t border-gold-400/15">
                      <Link
                        href={entry.pageUrl}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-burgundy-800/90 hover:bg-gold-400 hover:text-burgundy-950 text-gold-400 font-bold text-xs uppercase tracking-wider transition-colors border border-gold-400/30 shadow-gold group/btn"
                      >
                        <span>View Dedicated Tribute</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

