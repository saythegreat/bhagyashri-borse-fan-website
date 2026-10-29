"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Heart, Film, Image as ImageIcon, Video, Info, Shield, Menu, X } from "lucide-react";
import { getToken } from "@/lib/api";
import { getFavoriteIds } from "@/lib/favorites";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Check token and favorites
    setIsAdmin(!!getToken());
    setFavoriteCount(getFavoriteIds().length);

    const updateFavs = () => setFavoriteCount(getFavoriteIds().length);
    window.addEventListener("favorites-updated", updateFavs);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("favorites-updated", updateFavs);
    };
  }, []);

  // Automatically close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/filmography") {
      return pathname === "/filmography" || pathname.startsWith("/movies");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Sparkles },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/filmography", label: "Filmography", icon: Film },
    { href: "/videos", label: "Videos", icon: Video },
    {
      href: "/favorites",
      label: "Favorites",
      icon: Heart,
      badge: favoriteCount > 0 ? favoriteCount : undefined,
    },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-auto transition-all duration-300 ${
        isScrolled
          ? "bg-burgundy-900/90 backdrop-blur-md border-b border-gold-400/20 py-3 shadow-cinematic"
          : "bg-gradient-to-b from-burgundy-900/80 to-transparent py-4 sm:py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="group flex flex-col shrink-0">
          <span className="font-cinzel text-lg sm:text-xl xl:text-2xl font-bold tracking-wider text-gold-gradient group-hover:opacity-90 transition-opacity">
            BHAGYASHREE
          </span>
          <span className="text-[10px] tracking-widest uppercase text-rose-300 font-sans -mt-1 font-medium">
            A World of Bhagyashri &bull; Fan Tribute
          </span>
        </Link>

        {/* Desktop Nav (lg screen and above to prevent tablet overflow) */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 shrink-0">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? "text-gold-400 bg-burgundy-800/80 border border-gold-400/30 shadow-gold"
                    : "text-blush/80 hover:text-ivory hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-gold-400" : "text-rose-400/80"}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500 text-ivory rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/collector"
              className="ml-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-400 text-burgundy-900 hover:bg-gold-300 transition-colors flex items-center gap-1 shadow-gold shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              Collector
            </Link>
          )}
        </nav>

        {/* Mobile / Tablet menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          {isAdmin && (
            <Link
              href="/collector"
              className="p-1.5 rounded-full bg-gold-400 text-burgundy-900 text-xs font-bold"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-burgundy-800/80 text-ivory border border-gold-400/20 hover:border-gold-400/40 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-burgundy-900/95 backdrop-blur-xl border-b border-gold-400/20 px-4 pt-3 pb-6 animate-fadeIn shadow-cinematic">
          <div className="flex flex-col space-y-2 max-w-md mx-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-base font-medium flex items-center justify-between transition-colors ${
                    active
                      ? "bg-burgundy-800 text-gold-400 border border-gold-400/30 shadow-gold"
                      : "text-blush hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-gold-400" : "text-rose-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs bg-rose-500 text-ivory rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/collector"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-base font-bold bg-gold-400 text-burgundy-900 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Media Collector Admin</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
