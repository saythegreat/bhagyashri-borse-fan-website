"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Key,
  Database,
  Download,
  FileText,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { ProviderInfo } from "@/types";
import { fetchProviders, getExportUrl } from "@/lib/api";

export default function SettingsPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [manifestGenerating, setManifestGenerating] = useState(false);
  const [manifestResult, setManifestResult] = useState<string | null>(null);

  const loadProviderInfo = async () => {
    setLoading(true);
    try {
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      console.error("Failed to load providers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderInfo();
  }, []);

  const handleGenerateManifest = async () => {
    setManifestGenerating(true);
    try {
      const resp = await fetch("/api/backend/export/manifest", {
        method: "POST",
      });
      const data = await resp.json();
      setManifestResult(`Manifest generated: ${data.total_items} public gallery items ready.`);
    } catch (err: any) {
      setManifestResult(`Error generating manifest: ${err.message}`);
    } finally {
      setManifestGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider mb-1 font-cinzel">
          <Settings className="w-4 h-4" />
          <span>Configuration Hub</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-ivory">
          Collector &amp; API Settings
        </h1>
        <p className="text-xs sm:text-sm text-blush/75 max-w-2xl font-sans mt-1">
          Review external search providers, verify API keys, manage collection exports, and configure
          storage settings.
        </p>
      </div>

      {/* Provider Status Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-lg font-bold text-ivory">
            Supported Discovery Providers
          </h2>
          <button
            onClick={loadProviderInfo}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map((p) => (
            <div
              key={p.name}
              className="bg-burgundy-900/60 border border-gold-400/25 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-base font-bold text-ivory">
                    {p.display_name}
                  </span>
                  {p.is_configured ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Key Needed</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-blush/75 leading-relaxed font-sans">
                  {p.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gold-400/15 text-[11px] text-blush/60 space-y-1">
                <div>
                  <strong>Key Required:</strong> {p.requires_key ? "Yes (Optional)" : "No (Open Access)"}
                </div>
                <div>
                  <strong>Search Status:</strong> {p.is_configured ? "Operational" : "Requires .env Setup"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Configuration Instructions */}
      <div className="bg-burgundy-900/40 border border-gold-400/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-card">
        <div className="flex items-center gap-2 text-gold-400 font-bold uppercase text-xs font-cinzel">
          <Key className="w-4 h-4" />
          <span>External API Configuration Guidance</span>
        </div>
        <p className="text-xs text-blush/85 leading-relaxed font-sans">
          The collector is pre-configured with <strong>Wikimedia Commons</strong> and <strong>Openverse</strong>,
          which operate completely free of charge with no API keys needed.
        </p>
        <p className="text-xs text-blush/80 leading-relaxed font-sans">
          If you wish to enable the <strong>Microsoft Azure Bing Image Search v7</strong> provider, edit{" "}
          <code>backend/.env</code> and configure your Azure Cognitive Services subscription key:
        </p>
        <pre className="p-4 rounded-xl bg-burgundy-950/90 border border-gold-400/20 text-gold-300 text-xs font-mono overflow-x-auto">
{`# Microsoft Azure Cognitive Services (Bing Search)
BING_IMAGE_SEARCH_API_KEY="your_azure_subscription_key_here"
BING_IMAGE_SEARCH_ENDPOINT="https://api.bing.microsoft.com/v7.0/images/search"`}
        </pre>
      </div>

      {/* Export & Backup Tools */}
      <div className="space-y-4">
        <h2 className="font-cinzel text-lg font-bold text-ivory">
          Data Export &amp; Backup Tools
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* JSON Export */}
          <a
            href={getExportUrl("json")}
            download
            className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card block"
          >
            <FileText className="w-6 h-6 text-gold-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-cinzel text-sm font-bold text-ivory">Export JSON Metadata</h3>
            <p className="text-[11px] text-blush/70">
              Download complete structured JSON records including hashes, tags, and license metadata.
            </p>
          </a>

          {/* CSV Export */}
          <a
            href={getExportUrl("csv")}
            download
            className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card block"
          >
            <FileText className="w-6 h-6 text-gold-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-cinzel text-sm font-bold text-ivory">Export CSV Spreadsheet</h3>
            <p className="text-[11px] text-blush/70">
              Export media catalogue to CSV for inspection in Excel or Google Sheets.
            </p>
          </a>

          {/* Manifest Generator */}
          <button
            onClick={handleGenerateManifest}
            disabled={manifestGenerating}
            className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card text-left w-full"
          >
            <Database className="w-6 h-6 text-gold-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-cinzel text-sm font-bold text-ivory">Generate Manifest</h3>
            <p className="text-[11px] text-blush/70">
              Re-generate clean public gallery JSON manifest from approved database records.
            </p>
          </button>

          {/* ZIP Archive */}
          <a
            href={getExportUrl("zip", true)}
            download
            className="p-5 rounded-2xl bg-burgundy-900/60 border border-gold-400/20 hover:border-gold-400/60 transition-all space-y-2 group shadow-card block"
          >
            <FileArchive className="w-6 h-6 text-gold-400 group-hover:scale-110 transition-transform" />
            <h3 className="font-cinzel text-sm font-bold text-ivory">Download Media ZIP</h3>
            <p className="text-[11px] text-blush/70">
              Package permitted local image files and metadata into a single ZIP archive.
            </p>
          </a>
        </div>

        {manifestResult && (
          <div className="p-3.5 rounded-xl bg-burgundy-900 border border-gold-400/30 text-xs text-gold-300">
            {manifestResult}
          </div>
        )}
      </div>
    </div>
  );
}
