import {
  MediaItem,
  SearchResultItem,
  ProviderInfo,
  DuplicatePair,
  VideoItem,
  CollectorStats,
  User,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/backend";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return API_BASE;
  }
  const raw =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api";
  const clean = raw.trim().replace(/\/$/, "");
  return clean.endsWith("/api") ? clean : `${clean}/api`;
}

const TOKEN_KEY = "bhagya_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth: boolean = false
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (requiresAuth) {
    throw new Error("Authentication required. Please log in.");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (HTTP ${response.status})`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/* ==================== Auth ==================== */
export async function loginAdmin(username: string, password: string): Promise<{ access_token: string; username: string; role: string }> {
  const data = await request<{ access_token: string; username: string; role: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function logoutAdmin(): Promise<void> {
  removeToken();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  try {
    return await request<User>("/auth/me", {}, true);
  } catch {
    removeToken();
    return null;
  }
}

/* ==================== Discovery ==================== */
export async function fetchProviders(): Promise<ProviderInfo[]> {
  return request<ProviderInfo[]>("/discovery/providers", {}, true);
}

export async function searchDiscovery(params: {
  query: string;
  provider: string;
  category?: string;
  limit?: number;
  offset?: number;
  min_width?: number;
  min_height?: number;
}): Promise<{ query: string; provider: string; total_results: number; results: SearchResultItem[] }> {
  return request("/discovery/search", {
    method: "POST",
    body: JSON.stringify(params),
  }, true);
}

export async function fetchSearchHistory(): Promise<any[]> {
  return request<any[]>("/discovery/history", {}, true);
}

/* ==================== Media ==================== */
export async function fetchMedia(params: {
  category?: string;
  search?: string;
  is_featured?: boolean;
  review_status?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<{ items: MediaItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  const query = new URLSearchParams();
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.is_featured !== undefined) query.set("is_featured", String(params.is_featured));
  if (params.review_status) query.set("review_status", params.review_status);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const qs = query.toString();
  return request(`/media${qs ? `?${qs}` : ""}`);
}

export async function fetchAllPublicMedia(params: {
  category?: string;
  search?: string;
} = {}): Promise<MediaItem[]> {
  const firstPage = await fetchMedia({
    ...params,
    review_status: "approved",
    page: 1,
    page_size: 100,
  });
  const pages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.total_pages - 1) }, (_, index) =>
      fetchMedia({
        ...params,
        review_status: "approved",
        page: index + 2,
        page_size: 100,
      }),
    ),
  );
  const records = [...firstPage.items, ...pages.flatMap((page) => page.items)];
  const unique = new Map<number, MediaItem>();
  const hashes = new Set<string>();

  for (const record of records) {
    if (unique.has(record.id)) continue;
    const contentHash = record.sha256_hash?.toLowerCase();
    if (contentHash && hashes.has(contentHash)) continue;
    unique.set(record.id, record);
    if (contentHash) hashes.add(contentHash);
  }

  return Array.from(unique.values());
}

export function getMediaImageUrl(media: MediaItem, thumbnail = false): string {
  if (media.local_path) {
    return `${API_BASE}/media/${media.id}/image${thumbnail ? "?thumbnail=true" : ""}`;
  }
  return media.direct_image_url;
}

export async function scanLocalMedia(): Promise<{
  imported_count: number;
  skipped_count: number;
  reclassified_count: number;
  failed_items: Array<{ path: string; error: string }>;
  imported_video_count: number;
  skipped_video_count: number;
  failed_video_items: Array<{ path: string; error: string }>;
  manual_review_count: number;
  manual_review_items: Array<{ path: string; media_type: string; reason: string }>;
  excluded_placeholder_count: number;
  category_counts: Record<string, number>;
  video_category_counts: Record<string, number>;
}> {
  return request("/media/scan-local", { method: "POST" }, true);
}

export async function fetchSingleMedia(id: number): Promise<MediaItem> {
  return request<MediaItem>(`/media/${id}`);
}

export async function importMedia(payload: {
  title: string;
  source_url: string;
  source_name: string;
  direct_image_url: string;
  category?: string;
  tags?: string;
  license_name?: string;
  license_url?: string;
  reuse_status?: string;
  download_now?: boolean;
}): Promise<MediaItem> {
  return request<MediaItem>("/media/import", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export async function bulkImportMedia(items: Array<{
  title: string;
  source_url: string;
  source_name: string;
  direct_image_url: string;
  category?: string;
  tags?: string;
  license_name?: string;
  license_url?: string;
  reuse_status?: string;
  download?: boolean;
}>): Promise<{ imported_count: number; failed_count: number; failed_items: any[] }> {
  return request("/media/bulk-import", {
    method: "POST",
    body: JSON.stringify({ items }),
  }, true);
}

export async function updateMedia(id: number, data: Partial<MediaItem>): Promise<MediaItem> {
  return request<MediaItem>(`/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, true);
}

export async function approveMedia(id: number): Promise<MediaItem> {
  return request<MediaItem>(`/media/${id}/approve`, { method: "POST" }, true);
}

export async function excludeMedia(id: number): Promise<MediaItem> {
  return request<MediaItem>(`/media/${id}/exclude`, { method: "POST" }, true);
}

export async function toggleFeatureMedia(id: number): Promise<MediaItem> {
  return request<MediaItem>(`/media/${id}/feature`, { method: "POST" }, true);
}

export async function deleteMedia(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/media/${id}`, { method: "DELETE" }, true);
}

export async function executeBulkAction(params: {
  media_ids: number[];
  action: "approve" | "exclude" | "delete" | "feature" | "unfeature" | "categorize";
  category?: string;
  tags?: string;
}): Promise<{ action: string; affected_count: number }> {
  return request("/media/bulk-action", {
    method: "POST",
    body: JSON.stringify(params),
  }, true);
}

export async function detectDuplicates(threshold: number = 8): Promise<DuplicatePair[]> {
  return request<DuplicatePair[]>(`/media/detect-duplicates?threshold=${threshold}`, {
    method: "POST",
  }, true);
}

/* ==================== Collector Stats ==================== */
export async function fetchCollectorStats(): Promise<CollectorStats> {
  return request<CollectorStats>("/collector/stats", {}, true);
}

/* ==================== Videos ==================== */
export async function fetchVideos(params: {
  category?: string;
  is_featured?: boolean;
  provider?: string;
  review_status?: string;
} = {}): Promise<VideoItem[]> {
  const query = new URLSearchParams();
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.is_featured !== undefined) query.set("is_featured", String(params.is_featured));
  if (params.provider) query.set("provider", params.provider);
  if (params.review_status) query.set("review_status", params.review_status);
  const qs = query.toString();
  return request<VideoItem[]>(`/videos${qs ? `?${qs}` : ""}`);
}

export async function addVideo(payload: {
  title: string;
  video_url: string;
  category: string;
  description?: string;
  is_featured?: boolean;
}): Promise<VideoItem> {
  return request<VideoItem>("/videos", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export async function deleteVideo(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/videos/${id}`, { method: "DELETE" }, true);
}

export async function updateVideo(
  id: number,
  data: Partial<Pick<VideoItem, "title" | "description" | "category" | "is_featured" | "review_status">>,
): Promise<VideoItem> {
  return request<VideoItem>(`/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, true);
}

export async function fetchLocalVideoPreview(videoId: string): Promise<string> {
  const token = getToken();
  if (!token) throw new Error("Authentication required. Please log in.");

  const response = await fetch(
    `${API_BASE}/videos/local/${encodeURIComponent(videoId)}/stream`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`Video preview failed (HTTP ${response.status})`);
  }

  return URL.createObjectURL(await response.blob());
}

/* ==================== Export Helpers ==================== */
export function getExportUrl(type: "json" | "csv" | "zip", onlyApproved: boolean = false): string {
  const token = getToken();
  return `${API_BASE}/export/${type}?token=${token || ""}${onlyApproved ? "&only_approved=true" : ""}`;
}
