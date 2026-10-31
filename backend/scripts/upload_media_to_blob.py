#!/usr/bin/env python3
"""
Automated Media Migration Script: Upload local photos and videos to Vercel Blob Storage.
Updates database records with high-speed CDN URLs while keeping original local files intact.
"""

import os
import sys
import time
import socket
import mimetypes
import argparse
from pathlib import Path
import httpx

# Add fallback DNS resolver hook for environments with restrictive local ISP/gateway DNS
try:
    import dns.resolver
    _orig_getaddrinfo = socket.getaddrinfo
    _orig_gethostbyname = socket.gethostbyname
    _dns_cache = {}

    def _resolve_host_fallback(host):
        if host in _dns_cache:
            return _dns_cache[host]
        try:
            res = dns.resolver.Resolver(configure=False)
            res.nameservers = ["8.8.8.8", "1.1.1.1"]
            answers = res.resolve(host, "A")
            ip = answers[0].address
            _dns_cache[host] = ip
            return ip
        except Exception:
            return host

    def _patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        try:
            return _orig_getaddrinfo(host, port, family, type, proto, flags)
        except socket.gaierror:
            fallback_ip = _resolve_host_fallback(host)
            return _orig_getaddrinfo(fallback_ip, port, family, type, proto, flags)

    def _patched_gethostbyname(host):
        try:
            return _orig_gethostbyname(host)
        except socket.gaierror:
            return _resolve_host_fallback(host)

    socket.getaddrinfo = _patched_getaddrinfo
    socket.gethostbyname = _patched_gethostbyname
except ImportError:
    pass

# Ensure UTF-8 output encoding for terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup paths
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.models.media import Media
from app.models.video import Video

VERCEL_BLOB_API = "https://blob.vercel-storage.com"

def upload_file_to_blob(
    file_path: Path,
    pathname: str,
    token: str,
    access: str = "public",
    retries: int = 3,
    timeout_sec: float = 60.0,
) -> str:
    """Upload a file to Vercel Blob with exponential backoff retries and return CDN URL."""
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "video/mp4" if file_path.suffix.lower() == ".mp4" else "image/jpeg"

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    url = f"{VERCEL_BLOB_API}/{pathname}"
    headers = {
        "authorization": f"Bearer {token}",
        "x-api-version": "7",
        "x-content-type": mime_type,
        "content-type": mime_type,
        "x-vercel-blob-access": access,
    }

    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = httpx.put(url, headers=headers, content=file_bytes, timeout=timeout_sec)
            if response.status_code in (200, 201):
                data = response.json()
                return data.get("url")
            elif 400 <= response.status_code < 500:
                # Client-side / auth error; retrying won't help
                raise RuntimeError(f"Blob upload rejected ({response.status_code}): {response.text}")
            else:
                last_error = f"HTTP {response.status_code}: {response.text}"
        except httpx.TransportError as exc:
            last_error = f"Transport error: {exc}"

        if attempt < retries:
            delay = 2 ** (attempt - 1)
            print(f"    [!] Upload failed (attempt {attempt}/{retries}): {last_error}. Retrying in {delay}s...")
            time.sleep(delay)

    raise RuntimeError(f"Blob upload failed after {retries} attempts: {last_error}")

def migrate_media_to_blob(
    db_url: str,
    blob_token: str,
    access: str = "public",
    limit: int = 0,
    batch_size: int = 10,
    dry_run: bool = False,
):
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(db_url, connect_args=connect_args)
    Session = sessionmaker(bind=engine)
    db = Session()

    project_root = backend_dir.parent
    photos_dir = project_root / "Photos"
    storage_dir = backend_dir / "storage"

    print(f"[*] Target database host: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    print(f"[*] Access mode: {access}")
    print(f"[*] Limit: {limit if limit > 0 else 'All items'}")
    print(f"[*] Dry run mode: {dry_run}")

    try:
        # 1. Migrate Photos / Images
        media_items = db.query(Media).filter(Media.review_status == "approved").order_by(Media.id.asc()).all()
        print(f"\n[*] Found {len(media_items)} approved media items in library...")

        uploaded_images = 0
        uploaded_thumbs = 0
        skipped_images = 0
        failed_images = 0

        for item in media_items:
            if limit > 0 and uploaded_images >= limit:
                print(f"[*] Reached specified limit ({limit}) for images.")
                break

            # Skip if already a remote Blob URL
            if item.local_path and item.local_path.startswith("http"):
                skipped_images += 1
                continue

            # Resolve local file candidate
            candidate = None
            if item.local_path:
                candidate = storage_dir / item.local_path
                if not candidate.exists():
                    candidate = photos_dir / Path(item.local_path).name

            if not candidate or not candidate.exists():
                for ext in [".jpg", ".jpeg", ".png", ".webp"]:
                    c = photos_dir / f"{item.title}{ext}"
                    if c.exists():
                        candidate = c
                        break

            if candidate and candidate.exists():
                safe_stem = candidate.stem.replace(" ", "_")[:32]
                blob_pathname = f"images/{item.category}/{safe_stem}_{item.id}{candidate.suffix.lower()}"

                # Companion thumbnail candidate
                thumb_candidate = None
                if item.thumbnail_path and not item.thumbnail_path.startswith("http"):
                    tc = storage_dir / item.thumbnail_path
                    if tc.exists():
                        thumb_candidate = tc

                if dry_run:
                    print(f"  [Dry Run] Image #{item.id}: {candidate.name} -> {blob_pathname}")
                    if thumb_candidate:
                        print(f"    [Dry Run] Thumbnail: {thumb_candidate.name} -> thumbnails/thumb_{item.id}_{safe_stem}.jpg")
                        uploaded_thumbs += 1
                    uploaded_images += 1
                else:
                    try:
                        # Upload full image
                        cdn_url = upload_file_to_blob(
                            candidate, blob_pathname, blob_token, access=access, retries=3, timeout_sec=60.0
                        )
                        item.local_path = cdn_url
                        item.direct_image_url = cdn_url

                        # Upload companion thumbnail if available
                        if thumb_candidate:
                            thumb_pathname = f"thumbnails/thumb_{item.id}_{safe_stem}.jpg"
                            thumb_url = upload_file_to_blob(
                                thumb_candidate, thumb_pathname, blob_token, access=access, retries=3, timeout_sec=30.0
                            )
                            item.thumbnail_path = thumb_url
                            uploaded_thumbs += 1

                        db.commit()
                        uploaded_images += 1
                        print(f"  [+] Uploaded image #{item.id} -> {cdn_url}")
                    except Exception as err:
                        db.rollback()
                        failed_images += 1
                        print(f"  [!] Failed image #{item.id} ({candidate.name}): {err}")
            else:
                skipped_images += 1

        print(f"[*] Images Summary: {uploaded_images} uploaded ({uploaded_thumbs} thumbnails), {skipped_images} skipped, {failed_images} failed.")

        # 2. Migrate Videos
        videos = db.query(Video).filter(Video.provider == "local").order_by(Video.id.asc()).all()
        print(f"\n[*] Found {len(videos)} local videos in library...")

        uploaded_vids = 0
        skipped_vids = 0
        failed_vids = 0

        for vid in videos:
            if limit > 0 and uploaded_vids >= limit:
                print(f"[*] Reached specified limit ({limit}) for videos.")
                break

            if vid.local_path and vid.local_path.startswith("http"):
                skipped_vids += 1
                continue

            candidate = None
            if vid.local_path:
                candidate = project_root / vid.local_path
                if not candidate.exists():
                    candidate = photos_dir / Path(vid.local_path).name

            if not candidate or not candidate.exists():
                for ext in [".mp4", ".mov", ".webm"]:
                    c = photos_dir / f"{vid.title}{ext}"
                    if c.exists():
                        candidate = c
                        break

            if candidate and candidate.exists():
                blob_pathname = f"videos/{vid.video_id}{candidate.suffix.lower()}"
                if dry_run:
                    print(f"  [Dry Run] Video #{vid.id}: {candidate.name} -> {blob_pathname}")
                    uploaded_vids += 1
                else:
                    try:
                        cdn_url = upload_file_to_blob(
                            candidate, blob_pathname, blob_token, access=access, retries=3, timeout_sec=300.0
                        )
                        vid.local_path = cdn_url
                        vid.video_url = cdn_url
                        db.commit()
                        uploaded_vids += 1
                        print(f"  [+] Uploaded video #{vid.id} -> {cdn_url}")
                    except Exception as err:
                        db.rollback()
                        failed_vids += 1
                        print(f"  [!] Failed video #{vid.id} ({candidate.name}): {err}")
            else:
                skipped_vids += 1

        print(f"[*] Videos Summary: {uploaded_vids} uploaded, {skipped_vids} skipped, {failed_vids} failed.")
        print("\n[+] Media migration execution complete!")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload media to Vercel Blob")
    parser.add_argument(
        "--db-url",
        default=os.getenv("DATABASE_URL", f"sqlite:///{backend_dir / 'bhagyashri.db'}"),
        help="Target database connection URL",
    )
    parser.add_argument(
        "--token",
        default=os.getenv("BLOB_READ_WRITE_TOKEN", ""),
        help="Vercel Blob read/write token (or set BLOB_READ_WRITE_TOKEN env var)",
    )
    parser.add_argument(
        "--access",
        default="public",
        choices=["public", "private"],
        help="Blob access mode (public or private, default: public)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of images and videos to upload (0 for all, e.g. 3 for canary)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Database commit batch size (default: 10)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate the upload process without modifying files or database",
    )
    args = parser.parse_args()

    if not args.dry_run and not args.token:
        print("[!] Error: --token or BLOB_READ_WRITE_TOKEN environment variable is required (unless using --dry-run)")
        sys.exit(1)

    migrate_media_to_blob(
        args.db_url,
        args.token,
        access=args.access,
        limit=args.limit,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
    )
