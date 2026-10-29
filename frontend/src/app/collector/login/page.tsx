"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Key } from "lucide-react";
import { loginAdmin } from "@/lib/api";

export default function CollectorLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("BhagyaAdmin@2025!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginAdmin(username, password);
      router.push("/collector");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-burgundy-800/80 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-gold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
            Collector Dashboard
          </h1>
          <p className="text-xs text-blush/75 font-sans">
            Authorized administrator authentication required to access media discovery, library
            management, and duplicate review tools.
          </p>
        </div>

        {/* Card */}
        <div className="bg-burgundy-900/80 border border-gold-400/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-cinematic backdrop-blur-md">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-1.5 font-cinzel">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="w-full bg-burgundy-950/90 border border-gold-400/25 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400 transition-colors"
                />
                <User className="w-4 h-4 text-gold-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-1.5 font-cinzel">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full bg-burgundy-950/90 border border-gold-400/25 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400 transition-colors"
                />
                <Lock className="w-4 h-4 text-gold-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 disabled:opacity-50 transition-colors shadow-gold flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-burgundy-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In To Collector</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development Setup Hint Box */}
          <div className="p-3.5 rounded-xl bg-burgundy-950/60 border border-gold-400/15 text-xs text-blush/70 space-y-1.5">
            <div className="flex items-center gap-1.5 text-gold-400 font-bold text-[11px]">
              <Key className="w-3.5 h-3.5" />
              <span>Initial Setup Credentials</span>
            </div>
            <p className="text-[11px]">
              For local development, default administrator credentials were initialized:
              <br />
              Username: <code className="text-gold-300 bg-burgundy-800 px-1 py-0.5 rounded">admin</code>
              <br />
              Password: <code className="text-gold-300 bg-burgundy-800 px-1 py-0.5 rounded">BhagyaAdmin@2025!</code>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-blush/60 hover:text-gold-400 transition-colors"
          >
            &larr; Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
