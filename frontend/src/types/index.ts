export type MediaCategory =
  | "all"
  | "beauty-queen"
  | "portraits"
  | "traditional"
  | "photoshoots"
  | "lenin"
  | "mr-bachchan"
  | "yaariyan-2"
  | "chandu-champion"
  | "promotions"
  | "events"
  | "casual"
  | "other";

export type ReviewStatus = "pending" | "approved" | "excluded";
export type ReuseStatus = "permitted" | "restricted" | "editorial" | "unknown";

export interface MediaItem {
  id: number;
  title: string;
  description?: string | null;
  source_url: string;
  source_name: string;
  direct_image_url: string;
  local_path?: string | null;
  thumbnail_path?: string | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  sha256_hash?: string | null;
  perceptual_hash?: string | null;
  category: string;
  tags: string;
  license_name?: string | null;
  license_url?: string | null;
  reuse_status: ReuseStatus;
  review_status: ReviewStatus;
  is_featured: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface SearchResultItem {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  direct_image_url: string;
  thumbnail_url?: string | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  license_name?: string | null;
  license_url?: string | null;
  reuse_status: ReuseStatus;
  inferred_category: string;
  confidence: number;
  is_already_imported: boolean;
  is_duplicate: boolean;
}

export interface ProviderInfo {
  name: string;
  display_name: string;
  description: string;
  is_configured: boolean;
  requires_key: boolean;
  supports_free_search: boolean;
}

export interface DuplicatePair {
  media_a: MediaItem;
  media_b: MediaItem;
  similarity_type: "exact_sha256" | "visual_phash";
  hamming_distance?: number | null;
  similarity_score: number;
  reason?: string;
}

export interface VideoItem {
  id: number;
  title: string;
  description?: string | null;
  provider: string;
  video_url: string;
  video_id: string;
  category:
    | "trailers"
    | "songs"
    | "interviews"
    | "promotions"
    | "lifestyle"
    | "reels"
    | "other";
  thumbnail_url?: string | null;
  is_featured: boolean;
  review_status: ReviewStatus;
  created_at: string;
}

export interface CollectorStats {
  total_media: number;
  approved_media: number;
  pending_media: number;
  excluded_media: number;
  featured_media: number;
  downloaded_media: number;
  total_videos: number;
  approved_videos: number;
  pending_videos: number;
  total_searches: number;
  total_discovered: number;
  duplicates_count: number;
  categories_breakdown: Record<string, number>;
  video_categories_breakdown: Record<string, number>;
  recent_activity: Array<{
    id: number;
    action: string;
    resource_type: string;
    details?: string;
    created_at: string;
  }>;
}

export interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}
