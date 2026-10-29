import { MediaItem, VideoItem } from "@/types";

const IGNORE_WORDS = new Set([
  "with",
  "from",
  "that",
  "this",
  "life",
  "best",
  "through",
  "saveclip",
  "app",
  "whatsapp",
  "video",
]);

function words(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/\s*\(\d+\)$/, "")
      .split(/[^a-z0-9]+/i)
      .filter((word) => word.length > 2 && !IGNORE_WORDS.has(word)),
  );
}

export function selectVideoPosters(
  videos: VideoItem[],
  photos: MediaItem[],
): Map<number, MediaItem> {
  const assigned = new Map<number, MediaItem>();
  const usedPhotoIds = new Set<number>();

  // Approved photos only
  const availablePhotos = photos.filter(
    (p) => p.review_status === "approved" || !p.review_status,
  );

  // First pass: Semantic word matching
  videos.forEach((video) => {
    const videoWords = words(video.title);
    if (videoWords.size === 0) return;

    const candidates = availablePhotos
      .map((photo) => {
        const photoWords = words(`${photo.title} ${photo.tags}`);
        const score = Array.from(videoWords).filter((word) =>
          photoWords.has(word),
        ).length;
        return { photo, score };
      })
      .filter(({ photo, score }) => score > 0 && !usedPhotoIds.has(photo.id))
      .sort((left, right) => right.score - left.score);

    if (candidates.length > 0) {
      const best = candidates[0].photo;
      assigned.set(video.id, best);
      usedPhotoIds.add(best.id);
    }
  });

  // Second pass: Assign unique approved photos to any video that didn't match words
  let photoIndex = 0;
  videos.forEach((video) => {
    if (assigned.has(video.id)) return;

    while (
      photoIndex < availablePhotos.length &&
      usedPhotoIds.has(availablePhotos[photoIndex].id)
    ) {
      photoIndex++;
    }

    if (photoIndex < availablePhotos.length) {
      const fallbackPhoto = availablePhotos[photoIndex];
      assigned.set(video.id, fallbackPhoto);
      usedPhotoIds.add(fallbackPhoto.id);
      photoIndex++;
    }
  });

  return assigned;
}
