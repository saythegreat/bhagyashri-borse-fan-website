"""
Full audit: verify database state, check for any photos/videos missing from DB,
check for ffmpeg, report hero video status.
"""
import sys
import hashlib
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.database import SessionLocal
from app.models.media import Media
from app.models.video import Video

db = SessionLocal()

try:
    # ---- DB counts ----
    approved_photos = db.query(Media).filter(Media.review_status == "approved").count()
    pending_photos  = db.query(Media).filter(Media.review_status == "pending").count()
    excluded_photos = db.query(Media).filter(Media.review_status == "excluded").count()
    approved_videos = db.query(Video).filter(Video.review_status == "approved").count()
    pending_videos  = db.query(Video).filter(Video.review_status == "pending").count()

    print("=== DATABASE STATE ===")
    print(f"  Photos approved: {approved_photos}")
    print(f"  Photos pending : {pending_photos}")
    print(f"  Photos excluded: {excluded_photos}")
    print(f"  Videos approved: {approved_videos}")
    print(f"  Videos pending : {pending_videos}")

    # ---- Scan Photos/ directory ----
    photos_dir = PROJECT_ROOT / "Photos"
    if not photos_dir.exists():
        print(f"\nERROR: Photos/ directory not found at {photos_dir}")
    else:
        img_suffixes = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".heic", ".heif"}
        vid_suffixes = {".mp4", ".mov", ".webm", ".m4v", ".mkv", ".avi"}

        all_imgs = [f for f in photos_dir.rglob("*") if f.suffix.lower() in img_suffixes]
        all_vids = [f for f in photos_dir.rglob("*") if f.suffix.lower() in vid_suffixes]

        print(f"\n=== PHOTOS/ DIRECTORY ===")
        print(f"  Image files found: {len(all_imgs)}")
        print(f"  Video files found: {len(all_vids)}")

        # Check if any photos are missing from DB
        db_photos_by_hash = {m.sha256_hash: m for m in db.query(Media).filter(Media.source_name == "Project upload").all()}
        missing_photos = []
        for img in all_imgs:
            h = hashlib.sha256(img.read_bytes()).hexdigest()
            if h not in db_photos_by_hash:
                missing_photos.append(img.name)

        print(f"  Photos missing from DB: {len(missing_photos)}")
        if missing_photos:
            print("  Missing files:")
            for f in missing_photos[:20]:
                print(f"    - {f}")
            if len(missing_photos) > 20:
                print(f"    ... and {len(missing_photos) - 20} more")

        # Check if any videos are missing from DB
        db_videos_by_hash = {v.sha256_hash: v for v in db.query(Video).filter(Video.provider == "local").all()}
        missing_vids = []
        for vid in all_vids:
            h = hashlib.sha256(vid.read_bytes()).hexdigest()
            if h not in db_videos_by_hash:
                missing_vids.append(vid.name)

        print(f"  Videos missing from DB: {len(missing_vids)}")
        if missing_vids:
            for f in missing_vids:
                print(f"    - {f}")

    # ---- Hero video ----
    hero_name = "WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4"
    hero = db.query(Video).filter(Video.video_id == "2c1626db4b613a59").first()
    print(f"\n=== HERO VIDEO ===")
    if hero:
        print(f"  video_id      : {hero.video_id}")
        print(f"  review_status : {hero.review_status}")
        print(f"  thumbnail_url : {hero.thumbnail_url}")
        print(f"  local_path    : {hero.local_path}")
    else:
        print("  WARNING: Hero video not found by video_id!")

    # ---- ffmpeg check ----
    print(f"\n=== FFMPEG ===")
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=10)
        first_line = result.stdout.split("\n")[0]
        print(f"  Available: {first_line}")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("  NOT available -- video thumbnails cannot be auto-generated")

    # ---- Videos with null thumbnails ----
    null_thumb_vids = db.query(Video).filter(
        Video.provider == "local",
        Video.review_status == "approved",
        Video.thumbnail_url == None
    ).count()
    print(f"\n=== LOCAL VIDEOS WITH NULL THUMBNAIL ===")
    print(f"  Count: {null_thumb_vids}")

    # ---- Category breakdown of approved photos ----
    from sqlalchemy import func
    cats = db.query(Media.category, func.count(Media.id)).filter(
        Media.review_status == "approved"
    ).group_by(Media.category).all()
    print(f"\n=== APPROVED PHOTO CATEGORIES ===")
    for cat, cnt in sorted(cats, key=lambda x: -x[1]):
        print(f"  {cat or 'NULL':<20} : {cnt}")

    # ---- Category breakdown of approved videos ----
    vcats = db.query(Video.category, func.count(Video.id)).filter(
        Video.review_status == "approved"
    ).group_by(Video.category).all()
    print(f"\n=== APPROVED VIDEO CATEGORIES ===")
    for cat, cnt in sorted(vcats, key=lambda x: -x[1]):
        print(f"  {cat or 'NULL':<20} : {cnt}")

finally:
    db.close()

