"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Layers,
  Copy,
  Settings,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { logoutAdmin } from "@/lib/api";

export default function CollectorNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAdmin();
    router.push("/collector/login");
  };

  const navItems = [
    { href: "/collector", label: "Overview", icon: LayoutDashboard },
    { href: "/collector/discover", label: "Discover Media", icon: Compass },
    { href: "/collector/library", label: "Image Library", icon: Layers },
    { href: "/collector/duplicates", label: "Duplicates", icon: Copy },
    { href: "/collector/settings", label: "Settings & APIs", icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-burgundy-900/90 border-r border-gold-400/20 lg:min-h-screen p-5 flex flex-col justify-between">
      <div>
        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-gold-400 mb-1">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
            <span className="font-cinzel text-lg font-bold tracking-wider text-ivory">
              COLLECTOR
            </span>
          </div>
          <p className="text-xs text-rose-300 font-sans tracking-wide">
            A World of Bhagyashri Admin Hub
          </p>
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-burgundy-800 text-gold-400 border border-gold-400/30 shadow-card font-semibold"
                    : "text-blush/80 hover:text-ivory hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-gold-400" : "text-rose-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer controls */}
      <div className="mt-8 pt-6 border-t border-gold-400/15 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 text-xs rounded-lg text-blush/80 hover:text-ivory hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
            <span>View Public Website</span>
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
