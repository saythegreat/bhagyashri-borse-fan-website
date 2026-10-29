import type { MediaItem, VideoItem } from "@/types";

export function getCategoryLabel(category: string): string {
  const normalized = (category || "other").toLowerCase();
  switch (normalized) {
    case "beauty-queen":
      return "Beauty Queen";
    case "portraits":
      return "Portraits";
    case "traditional":
      return "Traditional Elegance";
    case "photoshoots":
      return "Photoshoots";
    case "events":
      return "Events & Galas";
    case "promotions":
      return "Promotions & Announcements";
    case "casual":
      return "Casual Moments";
    case "lenin":
      return "Lenin Movie";
    case "lifestyle":
      return "Behind the Scenes & Lifestyle";
    case "reels":
      return "Reels & Short Clips";
    case "other":
      return "Curated Archive";
    default:
      return normalized
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

/**
 * Returns true if the title looks like an automated camera filename,
 * a scraper hash, a social media media ID, or an unformatted technical code.
 */
export function isTechnicalTitle(rawTitle: string): boolean {
  if (!rawTitle) return true;
  const title = rawTitle.trim();
  if (title.length === 0) return true;

  // Known technical prefixes
  if (
    /^(SaveClip|WhatsApp|IMG_|DSC_|VID_|WP_|PXL_|Screenshot_|photo_|video_)/i.test(
      title,
    )
  ) {
    return true;
  }

  // File extension at end
  if (/\.(jpe?g|png|webp|gif|bmp|tiff|heic|mp4|mov|m4v|webm|avi|mkv)$/i.test(title)) {
    return true;
  }

  // Instagram / Facebook CDN hash patterns: e.g. 470948571_18477308329057741_4202920446148847705_n
  if (/^\d{6,}_\d{6,}_\d+/i.test(title) || /_\d{10,}_[a-z0-9]+$/i.test(title)) {
    return true;
  }

  // Very long uninterrupted alphanumeric token with no spaces (likely hash or base64 token)
  if (!title.includes(" ") && title.length >= 22) {
    return true;
  }

  // Hero asset raw name
  if (title.toLowerCase() === "bhagyashree-hero") {
    return true;
  }

  return false;
}

const CATEGORY_PHOTO_FALLBACKS: Record<string, string> = {
  "beauty-queen": "Beauty Queen Portrait",
  portraits: "Editorial Portrait",
  traditional: "Traditional Elegance",
  photoshoots: "Studio Editorial",
  events: "Public Appearance",
  promotions: "Promotional Appearance",
  casual: "Candid Moment",
  lenin: "Lenin Character Still",
  other: "Archive Photograph",
};

export function getMediaDisplayTitle(media: Partial<MediaItem>): string {
  const title = (media.title || "").trim();

  // Special hero exception
  if (
    media.title?.toLowerCase() === "bhagyashree-hero" ||
    media.tags?.toLowerCase() === "bhagyashree-hero.png"
  ) {
    return "Beauty Queen";
  }

  if (!isTechnicalTitle(title)) {
    return title;
  }

  const category = (media.category || "other").toLowerCase();
  const baseLabel = CATEGORY_PHOTO_FALLBACKS[category] || "Archive Photograph";

  if (typeof media.id === "number" && media.id > 0) {
    return `${baseLabel} #${String(media.id).padStart(2, "0")}`;
  }

  return baseLabel;
}

const CATEGORY_VIDEO_FALLBACKS: Record<string, string> = {
  trailers: "Official Trailer",
  songs: "Musical Performance",
  interviews: "Press Interview",
  promotions: "Promotional Reel",
  lifestyle: "Behind the Scenes Moment",
  reels: "Archival Reel Clip",
  other: "Featured Video Moment",
};

/**
 * Clean up raw social captions or technical video titles.
 */
export function getVideoDisplayTitle(video: Partial<VideoItem>): string {
  const rawTitle = (video.title || "").trim();

  // If technical filename (SaveClip, WhatsApp, hash), provide dignified presentation title
  if (isTechnicalTitle(rawTitle)) {
    const category = (video.category || "other").toLowerCase();
    const fallback = CATEGORY_VIDEO_FALLBACKS[category] || "Featured Video Moment";
    if (typeof video.id === "number" && video.id > 0) {
      return `${fallback} #${String(video.id).padStart(2, "0")}`;
    }
    return fallback;
  }

  // If title contains messy social media credits, clean it up for editorial elegance
  let cleaned = rawTitle
    // Remove trailing camera/edit credits like ".Edit- @gowtham_bheriShotby- @akashbabu_16"
    .replace(/\s*[.;\-]?\s*(?:Edit|Shotby|Wearing|Acc|Styled|Hair|Makeup)[-:\s].*$/i, "")
    // Remove handles like ".@pranav.foto"
    .replace(/\s*[.;\-]?\s*@[\w_.]+/g, "")
    // Remove hashtags like "#VanityDiaries" or "#HappyValentines"
    .replace(/#\w+/g, "")
    // Remove trailing question marks or emojis that got corrupted into ?
    .replace(/[?;]+\s*$/, "")
    // Normalize spaces
    .replace(/\s+/g, " ")
    .trim();

  // Handle number suffix like "(1)" or "1" -> "(Part 1)"
  cleaned = cleaned.replace(/\s*\((\d+)\)$/, " (Part $1)");

  // If cleanup left nothing or too short, fallback
  if (cleaned.length < 3) {
    const category = (video.category || "other").toLowerCase();
    const fallback = CATEGORY_VIDEO_FALLBACKS[category] || "Featured Video Moment";
    return typeof video.id === "number" ? `${fallback} #${String(video.id).padStart(2, "0")}` : fallback;
  }

  return cleaned;
}
