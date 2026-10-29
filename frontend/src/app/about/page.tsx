"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, Heart, Compass, Scale, Film } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-burgundy-800/80 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-widest shadow-gold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About The Tribute</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-gold-gradient">
          A World of Bhagyashri
        </h1>
        <p className="font-signature text-3xl sm:text-4xl text-rose-300">
          &ldquo;Some smiles stay in your heart forever.&rdquo;
        </p>
      </div>

      {/* Main Narrative */}
      <div className="bg-burgundy-900/60 border border-gold-400/25 rounded-3xl p-6 sm:p-10 space-y-6 shadow-card font-sans text-xs sm:text-sm text-blush/85 leading-relaxed">
        <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory">
          Project Mission & Purpose
        </h2>
        <p>
          <strong>A World of Bhagyashri</strong> is an independent non-commercial celebration created by
          passionate cinema admirers dedicated to Indian actress and model <strong>Bhagyashri Borse</strong>.
        </p>
        <p>
          Rising from prominent commercial campaigns to making waves in Hindi cinema (*Yaariyan 2*) and
          captivating South Indian audiences in her sensational Telugu debut as Jikki in *Mr. Bachchan* (2024),
          Bhagyashri has emerged as a beacon of natural grace, effortless dance rhythms, and expressive acting.
        </p>
        <p>
          This website was built to curate and organize verified information regarding her acting credits,
          public interviews, official trailers, and authentic public photographs in a cohesive, cinematic
          design experience.
        </p>
      </div>

      {/* Ethical Media Collection Principles */}
      <div className="space-y-6">
        <div className="border-b border-gold-400/20 pb-3">
          <div className="flex items-center gap-2 text-gold-400 font-bold uppercase tracking-wider text-xs font-cinzel">
            <Scale className="w-4 h-4" />
            <span>Ethical Standards & Media Stewardship</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory mt-1">
            How Media Is Discovered & Handled
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-burgundy-900/40 border border-gold-400/20 rounded-2xl p-6 space-y-2">
            <h3 className="font-cinzel text-sm font-bold text-gold-400">
              1. Source Attribution & Transparency
            </h3>
            <p className="text-xs text-blush/80 leading-relaxed">
              Every photograph indexed in our database retains its original source link, publisher name,
              and licensing terms. We never claim ownership of indexed photographs.
            </p>
          </div>

          <div className="bg-burgundy-900/40 border border-gold-400/20 rounded-2xl p-6 space-y-2">
            <h3 className="font-cinzel text-sm font-bold text-gold-400">
              2. No Private Account Scraping
            </h3>
            <p className="text-xs text-blush/80 leading-relaxed">
              We strictly forbid bypassing logins, paywalls, or privacy controls. We only discover images
              from public open-access archives (like Wikimedia Commons) and legitimate public search APIs.
            </p>
          </div>

          <div className="bg-burgundy-900/40 border border-gold-400/20 rounded-2xl p-6 space-y-2">
            <h3 className="font-cinzel text-sm font-bold text-gold-400">
              3. Human Review & Curation
            </h3>
            <p className="text-xs text-blush/80 leading-relaxed">
              Discovered media does not automatically enter the public gallery. Each candidate image is
              reviewed, verified, checked for visual duplicates via perceptual hashing, and approved by the
              site curator.
            </p>
          </div>

          <div className="bg-burgundy-900/40 border border-gold-400/20 rounded-2xl p-6 space-y-2">
            <h3 className="font-cinzel text-sm font-bold text-gold-400">
              4. Respect for Video Platforms
            </h3>
            <p className="text-xs text-blush/80 leading-relaxed">
              Curated videos feature official YouTube trailer and song embeds (ensuring views and impressions go directly to the original creators and music labels), alongside approved local project archive video moments.
            </p>
          </div>
        </div>
      </div>

      {/* Official Legal Disclaimer Box */}
      <div className="bg-burgundy-950 border border-gold-400/30 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-rose-300 font-bold uppercase text-xs tracking-wider">
          <Shield className="w-4 h-4 text-gold-400" />
          <span>Non-Affiliation Notice</span>
        </div>
        <p className="text-xs text-blush/80 leading-relaxed font-sans">
          This site is not affiliated with, authorized, or endorsed by Bhagyashri Borse, her talent agents,
          or any film production house. All trademarks, character names, and copyright material belong to
          their respective rightful owners. If you are a copyright owner and wish to request attribution updates
          or removal of a specific piece of media, please contact the administrator.
        </p>
      </div>
    </div>
  );
}
