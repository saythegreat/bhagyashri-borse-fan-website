"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Search,
  Filter,
  Download,
  Plus,
  Check,
  ExternalLink,
  Eye,
  AlertCircle,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckSquare,
  Square,
  Loader2,
  X,
} from "lucide-react";
import { SearchResultItem, ProviderInfo } from "@/types";
import {
  searchDiscovery,
  fetchProviders,
  importMedia,
  bulkImportMedia,
} from "@/lib/api";
import { getCategoryLabel } from "@/lib/mediaLabels";

const PRESET_QUERIES = [
  "Bhagyashri Borse",
  "Bhagyashri Borse portrait",
  "Bhagyashri Borse traditional look",
  "Bhagyashri Borse photoshoot",
  "Bhagyashri Borse Lenin",
  "Bhagyashri Borse public appearance",
  "Bhagyashri Borse interview",
  "Bhagyashri Borse movie promotional still",
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("Bhagyashri Borse");
  const [provider, setProvider] = useState("wikimedia");
  const [category, setCategory] = useState("all");
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Preview modal
  const [previewItem, setPreviewItem] = useState<SearchResultItem | null>(null);

  useEffect(() => {
    async function loadProviders() {
      try {
        const provs = await fetchProviders();
        setProviders(provs);
      } catch (err) {
        console.error("Failed to load providers:", err);
      }
    }
    loadProviders();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    setSelectedIds([]);

    try {
      const data = await searchDiscovery({
        query,
        provider,
        category: category !== "all" ? category : undefined,
        min_width: minWidth,
        limit: 24,
      });
      setResults(data.results || []);
      setTotalResults(data.total_results || 0);
    } catch (err: any) {
      setError(err.message || "Failed to execute discovery search.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === results.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(results.map((r) => r.id));
    }
  };

  const handleSingleImport = async (item: SearchResultItem, downloadNow: boolean) => {
    try {
      await importMedia({
        title: item.title,
        source_url: item.source_url,
        source_name: item.source_name,
        direct_image_url: item.direct_image_url,
        category: item.inferred_category || "other",
        tags: query,
        license_name: item.license_name || undefined,
        license_url: item.license_url || undefined,
        reuse_status: item.reuse_status,
        download_now: downloadNow,
      });

      // Mark as imported locally
      setResults((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, is_already_imported: true } : r))
      );
      setImportNotification(`Successfully imported: "${item.title.slice(0, 30)}..."`);
      setTimeout(() => setImportNotification(null), 4000);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleBulkImport = async (downloadFiles: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkImporting(true);

    const itemsToImport = results
      .filter((r) => selectedIds.includes(r.id))
      .map((r) => ({
        title: r.title,
        source_url: r.source_url,
        source_name: r.source_name,
        direct_image_url: r.direct_image_url,
        category: r.inferred_category || "other",
        tags: query,
        license_name: r.license_name || undefined,
        license_url: r.license_url || undefined,
        reuse_status: r.reuse_status,
        download: downloadFiles,
      }));

    try {
      const res = await bulkImportMedia(itemsToImport);
      setImportNotification(
        `Batch completed: ${res.imported_count} imported, ${res.failed_count} failed.`
      );
      // Mark as imported
      setResults((prev) =>
        prev.map((r) =>
          selectedIds.includes(r.id) ? { ...r, is_already_imported: true } : r
        )
      );
      setSelectedIds([]);
      setTimeout(() => setImportNotification(null), 5000);
    } catch (err: any) {
      alert(`Bulk import error: ${err.message}`);
    } finally {
      setIsBulkImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider mb-1 font-cinzel">
          <Compass className="w-4 h-4" />
          <span>Automatic Media Collector</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-ivory">
          Discover & Collect Photographs
        </h1>
        <p className="text-xs sm:text-sm text-blush/75 max-w-2xl font-sans mt-1">
          Search open-access and external repositories automatically. Inspect licenses, preview candidate
          images, prevent duplicate ingestion, and import directly into the management library.
        </p>
      </div>

      {/* Preset Queries */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-wider text-gold-400/80 font-bold font-cinzel block">
          Quick Preset Queries:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setQuery(preset);
              }}
              className={`px-3 py-1 rounded-full text-xs transition-all border ${
                query === preset
                  ? "bg-gold-400 text-burgundy-900 border-gold-400 font-bold"
                  : "bg-burgundy-900/60 text-blush/80 border-gold-400/20 hover:border-gold-400/50 hover:text-ivory"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Provider Control Panel */}
      <div className="bg-burgundy-900/70 border border-gold-400/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-cinematic backdrop-blur-md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search queries, e.g. 'Bhagyashri Borse portrait'..."
                className="w-full bg-burgundy-950/90 border border-gold-400/30 rounded-xl px-4 py-3 pl-11 text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400 transition-colors"
              />
              <Search className="w-5 h-5 text-gold-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 disabled:opacity-50 transition-colors shadow-gold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Search Provider</span>
                </>
              )}
            </button>
          </div>

          {/* Provider and Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gold-400/15">
            {/* Provider Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-400 mb-1.5 font-cinzel">
                Discovery Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-burgundy-950/90 border border-gold-400/25 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
              >
                <option value="wikimedia">Wikimedia Commons (Free &amp; Open Access)</option>
                <option value="openverse">Openverse (Creative Commons)</option>
                <option value="bing">Bing Image Search v7 (Azure Key Required)</option>
              </select>
            </div>

            {/* Inferred Category Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-400 mb-1.5 font-cinzel">
                Target Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-burgundy-950/90 border border-gold-400/25 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
              >
                <option value="all">All Categories</option>
                <option value="portraits">Portraits</option>
                <option value="traditional">Traditional Look</option>
                <option value="photoshoots">Photoshoots</option>
                <option value="lenin">Lenin Movie Still</option>
                <option value="promotions">Promotions &amp; Press</option>
                <option value="events">Public Events</option>
                <option value="casual">Casual &amp; Airport</option>
              </select>
            </div>

            {/* Min Resolution */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-400 mb-1.5 font-cinzel">
                Min Width Resolution
              </label>
              <select
                value={minWidth || ""}
                onChange={(e) => setMinWidth(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-burgundy-950/90 border border-gold-400/25 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
              >
                <option value="">Any Resolution</option>
                <option value="800">Minimum 800px Width</option>
                <option value="1200">Minimum 1200px Width (HD)</option>
                <option value="1920">Minimum 1920px Width (Full HD)</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Notification Toast */}
      {importNotification && (
        <div className="p-4 rounded-2xl bg-green-900/60 border border-green-500/40 text-green-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>{importNotification}</span>
          </div>
          <button onClick={() => setImportNotification(null)}>
            <X className="w-4 h-4 text-green-300" />
          </button>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm space-y-2 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-rose-300 font-cinzel">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Discovery Search Notice</span>
          </div>
          <p className="leading-relaxed">{error}</p>
          {error.includes("Bing") && (
            <p className="text-xs text-blush/75">
              To use Bing Image Search, add your <code>BING_IMAGE_SEARCH_API_KEY</code> to <code>backend/.env</code>.
              Alternatively, switch to <strong>Wikimedia Commons</strong> or <strong>Openverse</strong> for free, keyless searches!
            </p>
          )}
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {results.length > 0 && (
        <div className="bg-burgundy-900/80 border border-gold-400/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20 backdrop-blur-md shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300"
            >
              {selectedIds.length === results.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedIds.length === results.length ? "Deselect All" : "Select All"} ({results.length})
              </span>
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs text-blush/80">
                &bull; <strong>{selectedIds.length}</strong> selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkImport(false)}
              disabled={selectedIds.length === 0 || isBulkImporting}
              className="px-4 py-2 rounded-xl bg-burgundy-800 border border-gold-400/30 text-gold-400 text-xs font-semibold hover:bg-burgundy-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Selected (Metadata)</span>
            </button>

            <button
              onClick={() => handleBulkImport(true)}
              disabled={selectedIds.length === 0 || isBulkImporting}
              className="px-4 py-2 rounded-xl bg-gold-400 text-burgundy-900 text-xs font-bold hover:bg-gold-300 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-gold"
            >
              {isBulkImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download &amp; Ingest Local Media</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl bg-burgundy-900/60 border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? "border-gold-400 shadow-gold"
                    : "border-gold-400/20 hover:border-gold-400/50"
                }`}
              >
                {/* Image Box */}
                <div className="relative aspect-[3/4] bg-black overflow-hidden">
                  <img
                    src={item.thumbnail_url || item.direct_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="absolute top-2.5 left-2.5 z-10 p-1 rounded-lg bg-burgundy-900/80 backdrop-blur-md text-ivory border border-gold-400/30"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-gold-400" />
                    ) : (
                      <Square className="w-4 h-4 text-blush/60" />
                    )}
                  </button>

                  {/* Status Badges */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
                    {item.is_already_imported && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/90 text-white shadow">
                        In Library
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-burgundy-900/80 text-gold-400 border border-gold-400/30">
                      {getCategoryLabel(item.inferred_category)}
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2.5 rounded-full bg-gold-400 text-burgundy-900 shadow hover:scale-110 transition-transform"
                      title="Preview Image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-burgundy-800 text-ivory border border-gold-400/30 shadow hover:scale-110 transition-transform"
                      title="Open Source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel text-xs font-bold text-ivory line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-blush/60">
                      <span className="truncate max-w-[120px]">{item.source_name}</span>
                      {item.width && item.height && (
                        <span>{item.width} &times; {item.height}</span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Import Buttons */}
                  <div className="pt-2 border-t border-gold-400/15 flex items-center gap-1.5">
                    <button
                      onClick={() => handleSingleImport(item, false)}
                      disabled={item.is_already_imported}
                      className="flex-1 py-1.5 rounded-lg bg-burgundy-800 border border-gold-400/20 text-[11px] font-semibold text-gold-400 hover:bg-gold-400 hover:text-burgundy-900 disabled:opacity-40 transition-colors"
                    >
                      {item.is_already_imported ? "Imported" : "Add to Lib"}
                    </button>
                    <button
                      onClick={() => handleSingleImport(item, true)}
                      disabled={item.is_already_imported}
                      className="p-1.5 rounded-lg bg-gold-400 text-burgundy-900 hover:bg-gold-300 disabled:opacity-40 transition-colors"
                      title="Download Local Copy"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-4xl bg-burgundy-900 border border-gold-400/30 rounded-3xl overflow-hidden shadow-cinematic flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 bg-black p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={previewItem.direct_image_url}
                alt={previewItem.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="w-full md:w-80 p-6 flex flex-col justify-between space-y-4 bg-burgundy-950">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold-400/20 text-gold-400 border border-gold-400/30">
                    {getCategoryLabel(previewItem.inferred_category)}
                  </span>
                  <button onClick={() => setPreviewItem(null)}>
                    <X className="w-5 h-5 text-blush/60 hover:text-ivory" />
                  </button>
                </div>

                <h3 className="font-cinzel text-base font-bold text-ivory">
                  {previewItem.title}
                </h3>

                <div className="space-y-1.5 text-xs text-blush/75 pt-2 border-t border-gold-400/15">
                  <p><strong>Provider:</strong> {previewItem.source_name}</p>
                  {previewItem.width && previewItem.height && (
                    <p><strong>Resolution:</strong> {previewItem.width} &times; {previewItem.height} px</p>
                  )}
                  <p><strong>License:</strong> {previewItem.license_name || "Unknown / Editorial"}</p>
                  <p><strong>Reuse Rights:</strong> {previewItem.reuse_status}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gold-400/15">
                <button
                  onClick={() => {
                    handleSingleImport(previewItem, true);
                    setPreviewItem(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-colors shadow-gold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download &amp; Add To Collection</span>
                </button>
                <a
                  href={previewItem.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-burgundy-800 text-blush text-xs font-semibold hover:text-ivory text-center block"
                >
                  Inspect Source Webpage &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
