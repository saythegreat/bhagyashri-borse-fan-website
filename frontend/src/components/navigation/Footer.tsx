import React from "react";
import Link from "next/link";
import { Heart, Sparkles, Film, Shield, ArrowUpRight } from "lucide-react";

const FAN_APPRECIATIONS = [
  "Some smiles stay in your heart forever.",
  "Grace in every frame, elegance in every step.",
  "Bringing radiance, charisma, and classic cinema charm to modern storytelling.",
  "Celebrating the journey, craft, and magnetic screen presence of Bhagyashri Borse.",
  "From music rhythms to dramatic screens, an unforgettable presence.",
];

export default function Footer() {
  const quote = FAN_APPRECIATIONS[0];

  return (
    <footer className="bg-burgundy-900 border-t border-gold-400/20 text-blush relative overflow-hidden pt-16 pb-12">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Quote */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col">
              <span className="font-cinzel text-2xl font-bold tracking-widest text-gold-gradient">
                A WORLD OF BHAGYASHRI
              </span>
              <span className="text-xs uppercase tracking-widest text-rose-300 font-sans">
                A Fan Tribute to Bhagyashri Borse
              </span>
            </div>
            <p className="font-editorial italic text-ivory/90 text-lg border-l-2 border-gold-400 pl-4 py-1">
              &ldquo;{quote}&rdquo;
            </p>
            <p className="text-xs text-blush/70 max-w-md leading-relaxed">
              Curated by devoted cinema admirers celebrating her Telugu and Hindi cinematic ventures,
              dance rhythms, promotional appearances, and inspiring journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-400 mb-4">
              Explore The Tribute
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Curated Photo Gallery</span>
                </Link>
              </li>
              <li>
                <Link href="/filmography" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>Filmography & Projects</span>
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Official Video Showcase</span>
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Your Saved Favorites</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Admin */}
          <div>
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-400 mb-4">
              Project & Archives
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-gold-300 transition-colors">
                  About & Copyright Ethics
                </Link>
              </li>
              <li>
                <a
                  href="https://commons.wikimedia.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-300 transition-colors flex items-center gap-1"
                >
                  <span>Wikimedia Commons</span>
                  <ArrowUpRight className="w-3 h-3 text-rose-400" />
                </a>
              </li>
              <li>
                <Link href="/collector/login" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 text-xs text-blush/60 hover:text-gold-300 mt-4">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Media Collector Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Banner (Prominent and clear) */}
        <div className="border-t border-gold-400/15 pt-8 mt-8">
          <div className="bg-burgundy-800/60 border border-gold-400/20 rounded-xl p-4 text-xs text-blush/75 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-gold-400 font-semibold uppercase tracking-wider text-[11px]">
              <Shield className="w-3.5 h-3.5" />
              <span>Official Disclaimer & Fan Project Notice</span>
            </div>
            <p>
              <strong>A World of Bhagyashri</strong> is an unofficial, non-profit fan-made website created solely for
              the purpose of celebrating Indian actress Bhagyashri Borse. This website is not authorized, sponsored,
              endorsed by, or affiliated in any way with Bhagyashri Borse, her management agency, or any film production
              banner.
            </p>
            <p>
              All photographs, movie stills, and video material displayed on this site belong to their respective copyright
              holders, photographers, and studios. Media is indexed from publicly available databases (such as Wikimedia Commons)
              and authorized video embeds for non-commercial editorial fan commentary under fair dealing principles.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-blush/50 gap-4">
            <p>&copy; {new Date().getFullYear()} A World of Bhagyashri. Crafted with love by fans.</p>
            <p className="font-editorial italic text-rose-300/80">
              &ldquo;Some smiles stay in your heart forever.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
