"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MediaItem } from "@/types";
import { fetchAllPublicMedia, getMediaImageUrl } from "@/lib/api";
import ImageCard from "@/components/gallery/ImageCard";
import Lightbox from "@/components/gallery/Lightbox";

export default function LeninTributePage() {
  const [leninMedia, setLeninMedia] = useState<MediaItem[]>([]);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeninStills() {
      try {
        const res = await fetchAllPublicMedia();
        setLeninMedia(res.filter((item) => item.category === "lenin"));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Unable to load this archive.");
      } finally {
        setLoading(false);
      }
    }
    loadLeninStills();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Lenin Cinematic Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-20 bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-dark via-black/80 to-transparent z-10" />
        <img
          src={leninMedia[0] ? getMediaImageUrl(leninMedia[0], true) : "/images/bhagyashree-hero.png"}
          alt={leninMedia[0]?.title || "Bhagyashree Borse"}
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 animate-pulse"
        />

        <div className="max-w-4xl mx-auto text-center relative z-20 space-y-6">
          <Link
            href="/filmography"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-400 hover:text-gold-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Filmography</span>
          </Link>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-rose-300 font-bold block font-cinzel">
              Cinematic Spotlight
            </span>
            <h1 className="font-cinzel text-4xl sm:text-7xl font-bold tracking-tight text-gold-gradient">
              LENIN
            </h1>
            <p className="font-editorial italic text-rose-300 text-lg sm:text-2xl pt-2">
              Intensity, Character, and Atmospheric Storytelling
            </p>
          </div>

          <p className="text-xs sm:text-sm text-blush/85 max-w-2xl mx-auto leading-relaxed font-sans">
            A dedicated cinematic tribute celebrating Bhagyashri Borse&apos;s upcoming Telugu feature <em>Lenin</em>.
            An unofficial fan-made archive of approved photographs associated with the project.
          </p>
        </div>
      </section>

      {/* Project Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-burgundy-900/60 border border-gold-400/25 rounded-2xl p-6 space-y-2 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 font-cinzel">
              Project Status
            </span>
            <h3 className="font-cinzel text-lg font-bold text-ivory">Project archive</h3>
            <p className="text-xs text-blush/75 leading-relaxed">
              Project status and release details can change; check official announcements for updates.
            </p>
          </div>

          <div className="bg-burgundy-900/60 border border-gold-400/25 rounded-2xl p-6 space-y-2 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 font-cinzel">
              Gallery
            </span>
            <h3 className="font-cinzel text-lg font-bold text-ivory">Approved photographs</h3>
            <p className="text-xs text-blush/75 leading-relaxed">
              Only images approved in the media library are shown in this section.
            </p>
          </div>

          <div className="bg-burgundy-900/60 border border-gold-400/25 rounded-2xl p-6 space-y-2 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 font-cinzel">
              Fan tribute
            </span>
            <h3 className="font-cinzel text-lg font-bold text-ivory">Made with admiration</h3>
            <p className="text-xs text-blush/75 leading-relaxed">
              This is an unofficial archive and is not affiliated with the production.
            </p>
          </div>
        </div>
      </section>

      {/* Authorized Promotional Stills Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-gold-400/20 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-300">
              Media Archive
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient mt-1">
              Photos in the archive
            </h2>
          </div>
          <span className="text-xs text-blush/60 font-sans">
            {leninMedia.length} curated assets
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-burgundy-900/40 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <p role="alert" className="text-center text-sm text-rose-300">{loadError}</p>
        ) : leninMedia.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {leninMedia.map((item) => (
              <ImageCard
                key={item.id}
                media={item}
                onSelect={(m) => setActiveMedia(m)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-burgundy-900/30 border border-gold-400/20 rounded-2xl space-y-2">
            <p className="font-cinzel text-base text-ivory font-bold">
              No Approved Lenin Stills Yet
            </p>
            <p className="text-xs text-blush/70 font-editorial">
              Use the Collector Dashboard to discover and approve verified promotional stills for Lenin.
            </p>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {activeMedia && (
        <Lightbox
          media={activeMedia}
          items={leninMedia}
          onClose={() => setActiveMedia(null)}
          onNavigate={(item) => setActiveMedia(item)}
        />
      )}
    </div>
  );
}
