"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sliders,
  Sparkles,
} from "lucide-react";
import { DuplicatePair } from "@/types";
import {
  detectDuplicates,
  approveMedia,
  excludeMedia,
  deleteMedia,
} from "@/lib/api";
import MediaImage from "@/components/ui/MediaImage";

export default function DuplicatesPage() {
  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [threshold, setThreshold] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvedIds, setResolvedIds] = useState<number[]>([]);

  const scanDuplicates = async () => {
    setLoading(true);
    try {
      const data = await detectDuplicates(threshold);
      setPairs(data || []);
    } catch (err) {
      console.error("Error detecting duplicates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanDuplicates();
  }, [threshold]);

  const handleKeepA = async (pair: DuplicatePair, idx: number) => {
    try {
      await approveMedia(pair.media_a.id);
      await excludeMedia(pair.media_b.id);
      setResolvedIds((prev) => [...prev, idx]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleKeepB = async (pair: DuplicatePair, idx: number) => {
    try {
      await approveMedia(pair.media_b.id);
      await excludeMedia(pair.media_a.id);
      setResolvedIds((prev) => [...prev, idx]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleKeepBoth = async (pair: DuplicatePair, idx: number) => {
    try {
      await approveMedia(pair.media_a.id);
      await approveMedia(pair.media_b.id);
      setResolvedIds((prev) => [...prev, idx]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteB = async (pair: DuplicatePair, idx: number) => {
    if (!confirm(`Are you sure you want to permanently delete Duplicate B (#${pair.media_b.id})?`)) return;
    try {
      await deleteMedia(pair.media_b.id);
      setResolvedIds((prev) => [...prev, idx]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const activePairs = pairs.filter((_, idx) => !resolvedIds.includes(idx));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider mb-1 font-cinzel">
          <Copy className="w-4 h-4" />
          <span>Perceptual &amp; Hash Analysis</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-ivory">
          Duplicate Media Review
        </h1>
        <p className="text-xs sm:text-sm text-blush/75 max-w-2xl font-sans mt-1">
          Inspect visually similar and identical media pairs detected via 64-bit Perceptual Hashing (pHash)
          and SHA-256 cryptographic checksums. Decide which asset to publish.
        </p>
      </div>

      {/* Threshold Slider Bar */}
      <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-gold-400" />
          <div>
            <h3 className="font-cinzel text-sm font-bold text-ivory">
              Hamming Distance Sensitivity Threshold: {threshold}
            </h3>
            <p className="text-[11px] text-blush/60">
              Lower threshold (0-4) flags only near-identical images; higher threshold (8-14) catches slight
              re-compressions and crops.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="16"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-36 accent-gold-400 cursor-pointer"
          />
          <button
            onClick={scanDuplicates}
            className="px-4 py-1.5 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase hover:bg-gold-300 transition-colors shadow-gold"
          >
            Rescan
          </button>
        </div>
      </div>

      {/* Pairs List */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-burgundy-900/40 animate-pulse" />
          ))}
        </div>
      ) : activePairs.length > 0 ? (
        <div className="space-y-8">
          {activePairs.map((pair, idx) => {
            return (
              <div
                key={idx}
                className="bg-burgundy-900/60 border border-gold-400/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-cinematic"
              >
                {/* Header of Pair */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-400/15 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">
                      {(pair.similarity_score * 100).toFixed(1)}% Match
                    </span>
                    <span className="text-xs text-gold-400 font-semibold">
                      {pair.similarity_type === "exact_sha256"
                        ? "Identical Checksum (Exact File)"
                        : `Visual Similarity (Distance: ${pair.hamming_distance}/64)`}
                    </span>
                  </div>
                  <span className="text-xs text-blush/60 font-sans">
                    Pair #{idx + 1}
                  </span>
                </div>

                {/* Side-by-Side Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image A */}
                  <div className="bg-burgundy-950/70 border border-gold-400/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gold-400 font-cinzel">
                        Asset A (ID #{pair.media_a.id})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 uppercase">
                        {pair.media_a.review_status}
                      </span>
                    </div>

                    <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
                      <MediaImage
                        media={pair.media_a}
                        thumbnail
                        alt={pair.media_a.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="text-xs space-y-1 text-blush/80">
                      <h4 className="font-cinzel font-bold text-ivory line-clamp-1">
                        {pair.media_a.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-blush/60">
                        <span>Source: {pair.media_a.source_name}</span>
                        {pair.media_a.width && (
                          <span>{pair.media_a.width} &times; {pair.media_a.height}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Image B */}
                  <div className="bg-burgundy-950/70 border border-gold-400/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gold-400 font-cinzel">
                        Asset B (ID #{pair.media_b.id})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 uppercase">
                        {pair.media_b.review_status}
                      </span>
                    </div>

                    <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
                      <MediaImage
                        media={pair.media_b}
                        thumbnail
                        alt={pair.media_b.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="text-xs space-y-1 text-blush/80">
                      <h4 className="font-cinzel font-bold text-ivory line-clamp-1">
                        {pair.media_b.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-blush/60">
                        <span>Source: {pair.media_b.source_name}</span>
                        {pair.media_b.width && (
                          <span>{pair.media_b.width} &times; {pair.media_b.height}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolve Action Buttons */}
                <div className="pt-4 border-t border-gold-400/15 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleKeepA(pair, idx)}
                      className="px-4 py-2 rounded-xl bg-green-600/90 text-white font-bold text-xs uppercase hover:bg-green-500 transition-colors"
                    >
                      Keep Asset A (Exclude B)
                    </button>
                    <button
                      onClick={() => handleKeepB(pair, idx)}
                      className="px-4 py-2 rounded-xl bg-burgundy-800 border border-gold-400/30 text-gold-400 font-bold text-xs uppercase hover:bg-burgundy-700 transition-colors"
                    >
                      Keep Asset B (Exclude A)
                    </button>
                    <button
                      onClick={() => handleKeepBoth(pair, idx)}
                      className="px-4 py-2 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase hover:bg-gold-300 transition-colors"
                    >
                      Keep Both In Gallery
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteB(pair, idx)}
                    className="px-3.5 py-2 rounded-xl bg-rose-700/80 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Duplicate B</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-burgundy-900/30 border border-gold-400/20 rounded-3xl p-8 max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-green-900/40 border border-green-500/40 flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-cinzel text-xl font-bold text-ivory">No Duplicates Detected</h3>
          <p className="text-xs text-blush/75 font-editorial">
            Your media collection is cleanly deduplicated under the current Hamming distance threshold.
          </p>
        </div>
      )}
    </div>
  );
}
