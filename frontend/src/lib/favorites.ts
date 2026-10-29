const FAVORITES_KEY = "bhagya_fan_favorites";
const VIDEO_FAVORITES_KEY = "bhagya_fan_video_favorites";

/* ================= Photo Favorites ================= */

export function getFavoriteIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed.filter(
          (id): id is number => typeof id === "number" && Number.isSafeInteger(id),
        ),
      ),
    );
  } catch {
    return [];
  }
}

export function pruneFavoriteIds(validIds: number[]): number[] {
  const valid = new Set(validIds);
  const current = getFavoriteIds();
  const retained = current.filter((id) => valid.has(id));
  if (retained.length !== current.length && typeof window !== "undefined") {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(retained));
    window.dispatchEvent(new Event("favorites-updated"));
  }
  return retained;
}

export function isFavorite(id: number): boolean {
  const ids = getFavoriteIds();
  return ids.includes(id);
}

export function toggleFavorite(id: number): boolean {
  if (typeof window === "undefined") return false;
  const ids = getFavoriteIds();
  let updated: number[];
  let favorited: boolean;

  if (ids.includes(id)) {
    updated = ids.filter((itemId) => itemId !== id);
    favorited = false;
  } else {
    updated = [...ids, id];
    favorited = true;
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("favorites-updated"));
  return favorited;
}

/* ================= Video Favorites ================= */

export function getFavoriteVideoIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VIDEO_FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed.filter(
          (id): id is number => typeof id === "number" && Number.isSafeInteger(id),
        ),
      ),
    );
  } catch {
    return [];
  }
}

export function pruneFavoriteVideoIds(validIds: number[]): number[] {
  const valid = new Set(validIds);
  const current = getFavoriteVideoIds();
  const retained = current.filter((id) => valid.has(id));
  if (retained.length !== current.length && typeof window !== "undefined") {
    localStorage.setItem(VIDEO_FAVORITES_KEY, JSON.stringify(retained));
    window.dispatchEvent(new Event("favorites-updated"));
  }
  return retained;
}

export function isFavoriteVideo(id: number): boolean {
  const ids = getFavoriteVideoIds();
  return ids.includes(id);
}

export function toggleFavoriteVideo(id: number): boolean {
  if (typeof window === "undefined") return false;
  const ids = getFavoriteVideoIds();
  let updated: number[];
  let favorited: boolean;

  if (ids.includes(id)) {
    updated = ids.filter((itemId) => itemId !== id);
    favorited = false;
  } else {
    updated = [...ids, id];
    favorited = true;
  }

  localStorage.setItem(VIDEO_FAVORITES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("favorites-updated"));
  return favorited;
}
