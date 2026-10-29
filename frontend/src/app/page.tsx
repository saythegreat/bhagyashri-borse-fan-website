import type { Metadata } from "next";
import Link from "next/link";
import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  Clapperboard,
  Film,
  Heart,
  Sparkles,
} from "lucide-react";
import HomePhotoGrid from "@/components/home/HomePhotoGrid";
import HomeHeroVideo from "@/components/home/HomeHeroVideo";
import HomeVideoHighlights from "@/components/home/HomeVideoHighlights";
import { fetchAllPublicMedia } from "@/lib/api";
import type { MediaItem } from "@/types";

export const metadata: Metadata = {
  title: "Bhagyashree | A World of Bhagyashri",
  description:
    "A photo-filled fan tribute to Bhagyashri Borse, celebrating her portraits, films, and the moments in between.",
};

const projectPhotosDirectory = join(process.cwd(), "..", "Photos");
const HERO_VIDEO_FILENAME = "WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4";
const heroVideoId = createHash("sha256")
  .update(HERO_VIDEO_FILENAME)
  .digest("hex")
  .slice(0, 16);

function countMediaFiles(directory: string, extensions: string[]): number {
  return readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return total + countMediaFiles(entryPath, extensions);
    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    return total + Number(entry.isFile() && extensions.includes(extension));
  }, 0);
}

export default async function HomePage() {
  let initialPhotos: MediaItem[] = [];
  try {
    initialPhotos = await fetchAllPublicMedia();
  } catch {
    initialPhotos = [];
  }
  const photos = countMediaFiles(projectPhotosDirectory, [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
  ]);
  const videos = countMediaFiles(projectPhotosDirectory, [".mp4"]);

  return (
    <div className="home-page">
      <section className="home-hero relative -mt-16 flex min-h-[92svh] items-end overflow-hidden px-5 pb-16 pt-32 sm:px-10 lg:min-h-[calc(100svh+4rem)] lg:items-center lg:px-16 lg:pb-20">
        <img
          src="/images/bhagyashree-hero.png"
          alt="Bhagyashree in a golden traditional look"
          className="home-hero-image absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <HomeHeroVideo
          src={`/media/video-${heroVideoId}`}
          poster="/images/bhagyashree-hero.png"
        />
        <div className="home-hero-shade absolute inset-0" />
        <div className="home-hero-glow absolute inset-0" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px]">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f5d9ab] sm:text-xs">
              <span className="h-px w-8 bg-[#d8b779]" />
              A fan-made celebration
            </p>
            <h1 className="max-w-3xl font-editorial text-6xl font-normal leading-[0.91] tracking-[-0.055em] text-[#fff8f0] sm:text-7xl md:text-8xl lg:text-[112px]">
              Bhagyashree
              <span className="mt-2 block pl-1 font-signature text-6xl leading-none tracking-normal text-[#e7c48e] sm:text-7xl md:text-8xl lg:text-9xl">
                Borse
              </span>
            </h1>
            <p className="mt-8 max-w-lg font-editorial text-lg leading-relaxed text-white/80 sm:text-xl">
              A little stardust, a lot of heart. A visual love letter to every
              role, every look, and every lovely in-between.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#gallery"
                className="inline-flex items-center gap-3 rounded-full bg-[#f3dfbf] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#351a19] transition hover:bg-white"
              >
                Wander through the gallery
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/filmography"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/15 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.13em] text-white transition hover:border-white hover:bg-white/10"
              >
                <Film className="h-4 w-4" />
                Her films
              </Link>
            </div>
          </div>
          <a
            href="#welcome"
            className="mt-12 inline-flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white/65 transition hover:text-white lg:absolute lg:bottom-0 lg:right-0 lg:mb-1"
          >
            Scroll to explore
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
        <span className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#a3633f] via-[#eed5a9] to-[#813d3b]" />
      </section>

      <section id="welcome" className="home-welcome px-5 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="home-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              The moments we love
            </p>
            <h2 className="mt-4 max-w-xl font-editorial text-4xl font-normal leading-tight tracking-[-0.035em] text-[#382522] sm:text-5xl">
              A screen presence all her own.
            </h2>
          </div>
          <div className="md:pl-8">
            <p className="max-w-2xl text-sm leading-7 text-[#705c52] sm:text-base">
              From luminous portraits to the magic between takes, this is a
              growing scrapbook for Bhagyashri Borse. Made with admiration by
              fans, and filled with the photographs and videos you shared.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#d9c9b6] pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#806653]">
              <span>{photos} photographs</span>
              <span>{videos} little films</span>
              <span>One fan-made tribute</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Archive Collections */}
      <section className="home-collections px-5 pb-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#d9c9b6] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="home-eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Curated Themes
              </p>
              <h2 className="mt-3 font-editorial text-3xl font-normal tracking-[-0.03em] text-[#382522] sm:text-4xl">
                Featured Archive Collections
              </h2>
            </div>
            <p className="max-w-xs text-xs sm:text-sm text-[#806e61]">
              Explore categorized highlights from photo shoots, silver screen promotions, and timeless looks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                title: "Editorial Portraits",
                subtitle: "High-fashion & studio close-ups",
                category: "portraits",
                href: "/gallery?category=portraits",
                badge: "Portraits",
              },
              {
                title: "Traditional Elegance",
                subtitle: "Classic sarees & festival charm",
                category: "traditional",
                href: "/gallery?category=traditional",
                badge: "Heritage",
              },
              {
                title: "Golden Hour Glow",
                subtitle: "Natural warmth & editorial radiance",
                category: "photoshoots",
                href: "/gallery?category=photoshoots",
                badge: "Photoshoots",
              },
              {
                title: "Film Promotions",
                subtitle: "Theatrical releases & press moments",
                category: "promotions",
                href: "/gallery?category=promotions",
                badge: "Cinema",
              },
              {
                title: "Casual & Travel",
                subtitle: "Off-duty style & spontaneous smiles",
                category: "casual",
                href: "/gallery?category=casual",
                badge: "Candid",
              },
            ].map((col) => (
              <Link
                key={col.category}
                href={col.href}
                className="group flex flex-col justify-between rounded-2xl border border-[#e0d3c3] bg-white/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#c29a64] hover:bg-white hover:shadow-card"
              >
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f3dfbf] text-[#694326] border border-[#d8b779]/30 mb-3">
                    {col.badge}
                  </span>
                  <h3 className="font-editorial text-lg font-bold text-[#382522] group-hover:text-[#a47a4c] transition-colors">
                    {col.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#806e61] line-clamp-2">
                    {col.subtitle}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#855b40] group-hover:text-[#a47a4c] pt-3 border-t border-[#f0e4d7]">
                  <span>Explore theme</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="home-gallery px-5 pb-24 sm:px-10 sm:pb-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#d9c9b6] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="home-eyebrow">
                <Camera className="h-3.5 w-3.5" />
                The photo diary
              </p>
              <h2 className="mt-3 font-editorial text-4xl font-normal tracking-[-0.04em] text-[#382522] sm:text-5xl">
                In her own light
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#806e61]">
              A little glimpse into every mood, moment, and masterpiece.
            </p>
          </div>

          <HomePhotoGrid initialPhotos={initialPhotos} />
        </div>
      </section>

      <section className="home-film-strip relative overflow-hidden px-5 py-20 sm:px-10 sm:py-28">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-[#d6b47c]/20" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-[#d6b47c]/20" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.4fr] lg:items-center">
          <div>
            <p className="home-eyebrow home-eyebrow-light">
              <Clapperboard className="h-3.5 w-3.5" />
              Caught on camera
            </p>
            <h2 className="mt-4 font-editorial text-4xl font-normal leading-tight tracking-[-0.04em] text-[#fff8f0] sm:text-5xl">
              A little more
              <br />
              than a still.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#e8d8c5]/75">
              Press play for the behind-the-scenes smiles, soft Sunday moods,
              and spontaneous moments that make the best memories.
            </p>
            <Link
              href="/videos"
              className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#e7c48e] transition hover:text-white"
            >
              More videos
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <HomeVideoHighlights />
        </div>
      </section>

      <section className="home-films px-5 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 border-b border-[#d9c9b6] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="home-eyebrow">
                <Film className="h-3.5 w-3.5" />
                The silver screen
              </p>
              <h2 className="mt-3 font-editorial text-4xl font-normal tracking-[-0.04em] text-[#382522] sm:text-5xl">
                Stories she brings to life
              </h2>
            </div>
            <Link
              href="/filmography"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#855b40] transition hover:text-[#382522]"
            >
              Explore filmography
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                year: "2023 · Hindi",
                title: "Yaariyan 2",
                role: "Raajlaxmi",
                href: "/filmography",
                number: "01",
              },
              {
                year: "2024 · Telugu",
                title: "Mr. Bachchan",
                role: "Jikki",
                href: "/filmography",
                number: "02",
              },
              {
                year: "Coming soon",
                title: "Lenin",
                role: "A new chapter",
                href: "/movies/lenin",
                number: "03",
              },
            ].map((film) => (
              <Link
                key={film.title}
                href={film.href}
                className="home-film-card group flex min-h-48 flex-col justify-between rounded-xl border border-[#e0d3c3] bg-white/55 p-6 transition hover:-translate-y-1 hover:border-[#c29a64] hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#947960]">
                    {film.year}
                  </span>
                  <span className="font-editorial text-2xl text-[#d0bca4] transition group-hover:text-[#a47a4c]">
                    {film.number}
                  </span>
                </div>
                <div className="mt-8 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-editorial text-2xl text-[#382522]">
                      {film.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#806e61]">{film.role}</p>
                  </div>
                  <ArrowUpRight className="mb-1 h-4 w-4 text-[#a47a4c] transition group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-note px-5 pb-24 sm:px-10 sm:pb-32">
        <div className="mx-auto max-w-4xl border-y border-[#c7ab84]/35 py-12 text-center sm:py-16">
          <Heart className="mx-auto h-5 w-5 fill-[#b87866] text-[#b87866]" />
          <p className="mt-5 font-signature text-4xl text-[#a76d5b] sm:text-5xl">
            Made with love, always
          </p>
          <p className="mx-auto mt-4 max-w-xl font-editorial text-lg leading-relaxed text-[#5f4840] sm:text-xl">
            For the artist, the dreamer, and every story still waiting to be
            told. With love from your fans.
          </p>
          <p className="mt-6 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#967c66]">
            An unofficial fan tribute · Created with admiration
          </p>
        </div>
      </section>
    </div>
  );
}
