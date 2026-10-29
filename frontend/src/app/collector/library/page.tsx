"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
  Edit2,
  ExternalLink,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { MediaItem } from "@/types";
import {
  fetchMedia,
  updateMedia,
  approveMedia,
  excludeMedia,
  toggleFeatureMedia,
  deleteMedia,
  executeBulkAction,
  scanLocalMedia,
} from "@/lib/api";
import MediaImage from "@/components/ui/MediaImage";
import LocalVideoReviewQueue from "@/components/collector/LocalVideoReviewQueue";
import { getCategoryLabel } from "@/lib/mediaLabels";

export default function LibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [reviewStatus, setReviewStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Edit Modal
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editReviewStatus, setEditReviewStatus] = useState("pending");

  // Delete Confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const params = {
        category: category !== "all" ? category : undefined,
        search: search.trim() || undefined,
        review_status: reviewStatus !== "all" ? reviewStatus : undefined,
        page_size: 100,
      };
      const firstPage = await fetchMedia({ ...params, page: 1 });
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, firstPage.total_pages - 1) }, (_, index) =>
          fetchMedia({ ...params, page: index + 2 }),
        ),
      );
      setItems([
        ...firstPage.items,
        ...remainingPages.flatMap((pageResult) => pageResult.items),
      ]);
      setLoadError(null);
    } catch (err) {
      console.error("Failed to load library items:", err);
      setLoadError(err instanceof Error ? err.message : "Unable to load the media library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [category, reviewStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLibrary();
  };

  const handleScanLocalMedia = async () => {
    setScanLoading(true);
    setScanError(null);
    setScanMessage(null);
    try {
      const result = await scanLocalMedia();
      setScanMessage(
        `Imported ${result.imported_count} photos and ${result.imported_video_count} videos; skipped ${result.skipped_count} photos and ${result.skipped_video_count} videos; updated ${result.reclassified_count} photo categories; ${result.manual_review_count} item(s) need manual review; excluded ${result.excluded_placeholder_count} stock placeholders.` +
          (result.failed_items.length + result.failed_video_items.length
            ? ` ${result.failed_items.length + result.failed_video_items.length} file(s) could not be imported.`
            : ""),
      );
      await loadLibrary();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Local media scan failed.");
    } finally {
      setScanLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleQuickApprove = async (id: number) => {
    try {
      const updated = await approveMedia(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleQuickExclude = async (id: number) => {
    try {
      const updated = await excludeMedia(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err: any) {
      alert(`Exclusion error: ${err.message}`);
    }
  };

  const handleQuickFeature = async (id: number) => {
    try {
      const updated = await toggleFeatureMedia(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err: any) {
      alert(`Feature error: ${err.message}`);
    }
  };

  const handleOpenEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditCategory(item.category);
    setEditTags(item.tags || "");
    setEditReviewStatus(item.review_status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updated = await updateMedia(editingItem.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        tags: editTags,
        review_status: editReviewStatus as any,
      });

      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      setEditingItem(null);
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMedia(deletingId);
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      setSelectedIds((prev) => prev.filter((i) => i !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleBulkAction = async (action: "approve" | "exclude" | "delete" | "feature" | "unfeature") => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Are you sure you want to permanently delete ${selectedIds.length} media items?`)) {
      return;
    }

    try {
      await executeBulkAction({
        media_ids: selectedIds,
        action,
      });
      loadLibrary();
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Bulk action error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider mb-1 font-cinzel">
          <Layers className="w-4 h-4" />
          <span>Curator Control</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-ivory">
          Media Library Management
        </h1>
        <p className="text-xs sm:text-sm text-blush/75 max-w-2xl font-sans mt-1">
          Review collected images, update editorial captions, verify classifications, and approve
          media for publication in the public fan tribute gallery.
        </p>
        </div>
        <button
          type="button"
          onClick={handleScanLocalMedia}
          disabled={scanLoading}
          className="self-start rounded-xl bg-gold-400 px-4 py-2.5 text-xs font-bold text-burgundy-900 transition hover:bg-gold-300 disabled:opacity-50"
        >
          {scanLoading ? "Scanning project photos..." : "Scan Local Photos"}
        </button>
      </div>
      {scanMessage && <p role="status" className="text-sm text-emerald-200">{scanMessage}</p>}
      {scanError && <p role="alert" className="text-sm text-rose-300">{scanError}</p>}
      {loadError && <p role="alert" className="text-sm text-rose-300">Library load failed: {loadError}</p>}
      <LocalVideoReviewQueue />

      {/* Filter and Search Bar */}
      <div className="bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library by title, tag, or description..."
              className="w-full bg-burgundy-950/90 border border-gold-400/25 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-ivory placeholder-blush/40 focus:outline-none focus:border-gold-400"
            />
            <Search className="w-4 h-4 text-gold-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-colors shadow-gold"
          >
            Filter
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gold-400/15">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-400 mb-1 font-cinzel">
              Review Status
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              className="w-full bg-burgundy-950/90 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
            >
              <option value="all">All Review Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved (Public Gallery)</option>
              <option value="excluded">Excluded</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-400 mb-1 font-cinzel">
              Category Filter
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-burgundy-950/90 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
            >
              <option value="all">All Categories</option>
              <option value="portraits">Portraits</option>
              <option value="traditional">Traditional</option>
              <option value="photoshoots">Photoshoots</option>
              <option value="lenin">Lenin</option>
              <option value="mr-bachchan">Mr. Bachchan</option>
              <option value="yaariyan-2">Yaariyan 2</option>
              <option value="chandu-champion">Chandu Champion</option>
              <option value="promotions">Promotions</option>
              <option value="events">Events</option>
              <option value="casual">Casual</option>
              <option value="other">Beauty Queen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Controls */}
      {items.length > 0 && (
        <div className="bg-burgundy-900/80 border border-gold-400/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20 backdrop-blur-md shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300"
            >
              {selectedIds.length === items.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedIds.length === items.length ? "Deselect All" : "Select All"} ({items.length})
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
              onClick={() => handleBulkAction("approve")}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-green-600/90 hover:bg-green-500 text-white text-xs font-bold disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleBulkAction("exclude")}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-burgundy-800 border border-gold-400/20 hover:bg-burgundy-700 text-blush text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Exclude</span>
            </button>
            <button
              onClick={() => handleBulkAction("feature")}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-gold-400 text-burgundy-900 text-xs font-bold hover:bg-gold-300 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Feature</span>
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-burgundy-900/40 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-burgundy-900/30 border border-rose-400/20 rounded-2xl">
          <p className="text-sm text-rose-300">The media library could not be loaded.</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`group rounded-2xl bg-burgundy-900/60 border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? "border-gold-400 shadow-gold"
                    : "border-gold-400/20 hover:border-gold-400/50"
                }`}
              >
                {/* Image Area */}
                <div className="relative aspect-[3/4] bg-black overflow-hidden">
                  <MediaImage
                    media={item}
                    thumbnail
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Select Checkbox */}
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
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow ${
                        item.review_status === "approved"
                          ? "bg-green-600/90 text-white"
                          : item.review_status === "pending"
                          ? "bg-yellow-600/90 text-white"
                          : "bg-rose-600/90 text-white"
                      }`}
                    >
                      {item.review_status}
                    </span>
                    {item.is_featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold-400 text-burgundy-900 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold block">
                      {getCategoryLabel(item.category)}
                    </span>
                    <h3 className="font-cinzel text-xs font-bold text-ivory line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-blush/60 mt-1 truncate">
                      Source: {item.source_name}
                    </p>
                  </div>

                  {/* Control Actions Row */}
                  <div className="pt-3 border-t border-gold-400/15 flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      {item.review_status !== "approved" ? (
                        <button
                          onClick={() => handleQuickApprove(item.id)}
                          className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white transition-colors"
                          title="Approve for Public Gallery"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickExclude(item.id)}
                          className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                          title="Exclude from Public Gallery"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleQuickFeature(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.is_featured
                            ? "bg-gold-400 text-burgundy-900"
                            : "bg-burgundy-800 text-gold-400 hover:bg-gold-400 hover:text-burgundy-900"
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-burgundy-800 text-blush hover:text-ivory transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-burgundy-900/30 border border-gold-400/20 rounded-2xl">
          <p className="font-cinzel text-base font-bold text-ivory">No Media In Library</p>
          <p className="text-xs text-blush/70 mt-1 font-editorial">
            Discover new images to populate your collection.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="w-full max-w-lg bg-burgundy-900 border border-gold-400/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-cinematic"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gold-400/20 pb-3">
              <h3 className="font-cinzel text-lg font-bold text-ivory">Edit Media Details</h3>
              <button onClick={() => setEditingItem(null)}>
                <X className="w-5 h-5 text-blush/60 hover:text-ivory" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gold-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gold-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gold-400 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory"
                  >
                    <option value="portraits">Portraits</option>
                    <option value="traditional">Traditional</option>
                    <option value="photoshoots">Photoshoots</option>
                    <option value="lenin">Lenin</option>
                    <option value="mr-bachchan">Mr. Bachchan</option>
                    <option value="yaariyan-2">Yaariyan 2</option>
                    <option value="chandu-champion">Chandu Champion</option>
                    <option value="promotions">Promotions</option>
                    <option value="events">Events</option>
                    <option value="casual">Casual</option>
                    <option value="other">Beauty Queen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gold-400 mb-1">Review Status</label>
                  <select
                    value={editReviewStatus}
                    onChange={(e) => setEditReviewStatus(e.target.value)}
                    className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved (Public)</option>
                    <option value="excluded">Excluded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gold-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-3 py-2 text-xs text-ivory"
                />
              </div>

              <div className="pt-3 border-t border-gold-400/15 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-burgundy-800 text-blush text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-400 text-burgundy-900 font-bold text-xs uppercase shadow-gold hover:bg-gold-300"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="w-full max-w-sm bg-burgundy-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-cinematic text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-base font-bold text-ivory">Confirm Deletion</h3>
            <p className="text-xs text-blush/80">
              Are you sure you want to permanently delete this media record and its stored files?
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-burgundy-800 text-blush text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
