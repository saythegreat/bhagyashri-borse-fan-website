"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Layers,
  Copy,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Star,
  Activity,
  ArrowRight,
} from "lucide-react";
import { CollectorStats } from "@/types";
import { fetchCollectorStats } from "@/lib/api";
import { getCategoryLabel } from "@/lib/mediaLabels";

export default function CollectorOverviewPage() {
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchCollectorStats();
        setStats(data);
      } catch (err) {
        console.error("Error loading collector stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-10">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-burgundy-900 via-burgundy-800 to-burgundy-900 border border-gold-400/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-cinematic">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collector Command Center</span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-ivory">
            Media Management & Discovery Overview
          </h1>
          <p className="text-xs sm:text-sm text-blush/80 max-w-xl font-sans leading-relaxed">
            Search publicly available media, import candidate images, detect duplicate assets, organize
            categories, and curate which media gets published to the public fan gallery.
          </p>
        </div>

        <Link
          href="/collector/discover"
          className="px-6 py-3 rounded-full bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-colors shadow-gold flex items-center justify-center gap-2 shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Launch Discovery Search</span>
        </Link>
      </div>

      {/* Primary Database Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total in Library */}
        <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-5 space-y-2 shadow-card">
          <div className="flex items-center justify-between text-xs text-blush/70 font-semibold font-cinzel">
            <span>Total Media</span>
            <Layers className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-cinzel text-ivory">
            {loading ? "..." : stats?.total_media || 0}
          </div>
          <div className="text-[11px] text-blush/60 font-sans">
            Indexed records in database
          </div>
        </div>

        {/* Approved Media */}
        <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-5 space-y-2 shadow-card">
          <div className="flex items-center justify-between text-xs text-blush/70 font-semibold font-cinzel">
            <span>Approved & Published</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-cinzel text-green-300">
            {loading ? "..." : stats?.approved_media || 0}
          </div>
          <div className="text-[11px] text-blush/60 font-sans">
            Visible in public gallery
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-5 space-y-2 shadow-card">
          <div className="flex items-center justify-between text-xs text-blush/70 font-semibold font-cinzel">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-cinzel text-yellow-300">
            {loading ? "..." : stats?.pending_media || 0}
          </div>
          <div className="text-[11px] text-blush/60 font-sans">
            Requires curator approval
          </div>
        </div>

        {/* Potential Duplicates */}
        <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-5 space-y-2 shadow-card">
          <div className="flex items-center justify-between text-xs text-blush/70 font-semibold font-cinzel">
            <span>Potential Duplicates</span>
            <Copy className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-cinzel text-rose-300">
            {loading ? "..." : stats?.duplicates_count || 0}
          </div>
          <div className="text-[11px] text-blush/60 font-sans">
            Visual & SHA-256 matches
          </div>
        </div>
      </div>

      <section className="bg-burgundy-900/50 border border-gold-400/20 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-cinzel text-base font-bold text-ivory">
              Video Library
            </h2>
            <p className="mt-1 text-xs text-blush/70">
              Local clips share the existing video database and approval workflow.
            </p>
          </div>
          <Link
            href="/collector/library"
            className="text-xs font-semibold uppercase tracking-wider text-gold-300 hover:text-white"
          >
            Review pending local videos
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-blush/60">All videos</span>
            <span className="font-cinzel text-xl font-bold text-ivory">{loading ? "..." : stats?.total_videos || 0}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-blush/60">Approved</span>
            <span className="font-cinzel text-xl font-bold text-green-300">{loading ? "..." : stats?.approved_videos || 0}</span>
          </div>
          <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-blush/60">Needs review</span>
            <span className="font-cinzel text-xl font-bold text-gold-300">{loading ? "..." : stats?.pending_videos || 0}</span>
          </div>
        </div>
        {stats?.video_categories_breakdown &&
          Object.keys(stats.video_categories_breakdown).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.video_categories_breakdown).map(([category, count]) => (
                <span
                  key={category}
                  className="rounded-full border border-gold-400/15 px-3 py-1 text-[10px] text-blush/75"
                >
                  {getCategoryLabel(category)} ({count})
                </span>
              ))}
            </div>
          )}
      </section>

      {/* Secondary Metrics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Actions & Categories */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-burgundy-900/50 border border-gold-400/20 rounded-3xl p-6 space-y-4">
            <h2 className="font-cinzel text-base font-bold text-ivory">
              Category Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats?.categories_breakdown && Object.keys(stats.categories_breakdown).length > 0 ? (
                Object.entries(stats.categories_breakdown).map(([category, count]) => (
                  <div
                    key={category}
                    className="p-3 rounded-xl bg-burgundy-950/70 border border-gold-400/15 text-center"
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-300 font-cinzel truncate">
                      {getCategoryLabel(category)}
                    </span>
                    <span className="font-cinzel text-xl font-bold text-gold-400">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-6 text-xs text-blush/60 font-editorial">
                  No categorized media yet. Start by running discovery!
                </div>
              )}
            </div>
          </div>

          {/* Quick Hub Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/collector/discover"
              className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card"
            >
              <Compass className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-cinzel text-sm font-bold text-ivory">Discover Media</h3>
              <p className="text-[11px] text-blush/70">
                Search Wikimedia & providers for new images.
              </p>
            </Link>

            <Link
              href="/collector/library"
              className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card"
            >
              <Layers className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-cinzel text-sm font-bold text-ivory">Manage Library</h3>
              <p className="text-[11px] text-blush/70">
                Review, tag, categorize, and approve images.
              </p>
            </Link>

            <Link
              href="/collector/duplicates"
              className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card"
            >
              <Copy className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-cinzel text-sm font-bold text-ivory">Review Duplicates</h3>
              <p className="text-[11px] text-blush/70">
                Inspect visual similarity and resolve duplicates.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="lg:col-span-5">
          <div className="bg-burgundy-900/50 border border-gold-400/20 rounded-3xl p-6 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gold-400/15 pb-3">
                <div className="flex items-center gap-2 text-ivory font-cinzel font-bold text-sm">
                  <Activity className="w-4 h-4 text-gold-400" />
                  <span>Recent Collection Activity</span>
                </div>
              </div>

              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-burgundy-950/60 border border-gold-400/10 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-gold-300 font-semibold">
                        <span className="uppercase tracking-wider text-[10px]">
                          {log.action.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-blush/50">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      <p className="text-blush/80 text-[11px] line-clamp-1">{log.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-blush/60 font-editorial">
                  No recent activity logged yet.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gold-400/15 text-center">
              <Link
                href="/collector/settings"
                className="text-xs font-semibold text-gold-400 hover:text-gold-300 inline-flex items-center gap-1"
              >
                <span>View Configuration & Provider Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
