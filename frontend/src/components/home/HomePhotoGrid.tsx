"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { fetchAllPublicMedia, getMediaImageUrl } from "@/lib/api";
import { getMediaDisplayTitle } from "@/lib/mediaLabels";
import { MediaItem } from "@/types";
import Lightbox from "@/components/gallery/Lightbox";

function normalizeBaseTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s*\(\d+\)$/, "")
    .replace(/\s+\d+$/, "")
    .replace(/[#@].*$/, "")
    .trim()
    .slice(0, 25);
}

function selectCuratedHomePhotos(media: MediaItem[], targetCount: number = 12): MediaItem[] {
  // Only approved media items
  const approved = media.filter(
    (m) => m.review_status === "approved" || !m.review_status,
  );
  if (approved.length <= targetCount) return approved;

  const byCategory: Record<string, MediaItem[]> = {};
  for (const item of approved) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  const categoryOrder = [
    "beauty-queen",
    "portraits",
    "traditional",
    "photoshoots",
    "events",
    "promotions",
    "casual",
    "lenin",
  ];

  const selected: MediaItem[] = [];
  const selectedIds = new Set<number>();
  const seenHashes = new Set<string>();
  const seenBaseTitles = new Set<string>();

  // Round-robin selection across categories preventing shoot duplicates
  for (let round = 0; round < 20; round++) {
    for (const cat of categoryOrder) {
      const catItems = byCategory[cat] || [];
      if (catItems.length > round) {
        const item = catItems[round];
        const baseTitle = normalizeBaseTitle(item.title);
        const hash = item.sha256_hash || item.perceptual_hash;

        if (
          !selectedIds.has(item.id) &&
          (!hash || !seenHashes.has(hash)) &&
          (!baseTitle || !seenBaseTitles.has(baseTitle))
        ) {
          selected.push(item);
          selectedIds.add(item.id);
          if (hash) seenHashes.add(hash);
          if (baseTitle) seenBaseTitles.add(baseTitle);
          if (selected.length >= targetCount) break;
        }
      }
    }
    if (selected.length >= targetCount) break;
  }

  // Fill up to targetCount if needed
  if (selected.length < targetCount) {
    for (const item of approved) {
      if (!selectedIds.has(item.id)) {
        selected.push(item);
        selectedIds.add(item.id);
        if (selected.length >= targetCount) break;
      }
    }
  }

  return selected.slice(0, targetCount);
}

interface HomePhotoGridProps {
  initialPhotos?: MediaItem[];
}

export default function HomePhotoGrid({ initialPhotos = [] }: HomePhotoGridProps) {
  const [items, setItems] = useState<MediaItem[]>(initialPhotos);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const curatedItems = useMemo(() => selectCuratedHomePhotos(items, 12), [items]);

  useEffect(() => {
    let active = true;
    if (items.length === 0) {
      fetchAllPublicMedia()
        .then((media) => {
          if (active) setItems(media);
        })
        .catch((cause: unknown) => {
          if (active) {
            setError(
              cause instanceof Error ? cause.message : "Unable to load approved photographs.",
            );
          }
        });
    }
    return () => {
      active = false;
    };
  }, [items.length]);

  return (
    <>
      {error ? (
        <p role="alert" className="rounded-xl border border-[#d9c9b6] p-8 text-sm text-[#705c52]">
          The photo diary is temporarily unavailable. {error}
        </p>
      ) : curatedItems.length > 0 ? (
        <>
          <div className="home-photo-grid">
            {curatedItems.map((item) => {
              const caption = getMediaDisplayTitle(item);
              const isHeroPortrait = item.title === "bhagyashree-hero";
              return (
                <figure
                  key={item.id}
                  className="home-photo-card"
                >
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    aria-label={`View photograph: ${caption}`}
                    className="home-photo-link"
                  >
                    <img
                      src={getMediaImageUrl(item, true)}
                      alt={`Bhagyashri Borse — ${caption}`}
                      style={{ objectPosition: isHeroPortrait ? "66% 42%" : "50% 34%" }}
                      width={item.width || undefined}
                      height={item.height || undefined}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="home-photo-caption">
                      <span>{caption}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </button>
                </figure>
              );
            })}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full border border-[#d9c9b6] bg-white/75 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#382522] transition hover:border-[#c29a64] hover:bg-white hover:shadow-sm"
            >
              <span>Explore all {items.length} photographs in the gallery</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-[#d9c9b6] p-8 text-sm text-[#705c52]">
          Approved photographs will appear here after the media library has been scanned.
        </p>
      )}
      {activeItem && (
        <Lightbox
          media={activeItem}
          items={items}
          onClose={() => setActiveItem(null)}
          onNavigate={setActiveItem}
        />
      )}
    </>
  );
}
