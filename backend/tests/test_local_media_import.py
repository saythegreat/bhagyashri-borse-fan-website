from pathlib import Path

from PIL import Image

from app.config import settings
from app.models.media import Media
from app.models.video import Video
from app.services.local_media_import import import_local_images, import_local_videos
from app.services.media_categorizer import infer_media_category, infer_video_category


def test_local_scan_requires_admin(client):
    response = client.post("/api/media/scan-local")

    assert response.status_code == 401


def test_media_categorizer_matches_specific_film_before_generic_promotions():
    assert infer_media_category("bhagyashree-hero.png") == "beauty-queen"
    assert infer_media_category("Mr Bachchan poster.jpg") == "mr-bachchan"
    assert infer_media_category("Filmy max Outfit Stylist.jpg") == "photoshoots"
    assert infer_media_category("Everyday is Women’s day.jpg") == "events"
    assert infer_media_category("One love HappyValentines.jpg") == "casual"
    assert infer_media_category("family-photo.jpg") == "other"


def test_video_categorizer_marks_short_whatsapp_clips_as_reels():
    assert infer_video_category("WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4") == "reels"
    assert infer_video_category("Behind the scenes edit.mp4") == "lifestyle"
    assert infer_video_category("SaveClip.App_AQMEcOMAx.mp4") == "other"


def test_local_image_import_is_idempotent_and_preserves_source(
    db_session, tmp_path, monkeypatch
):
    source_directory = tmp_path / "Photos"
    source_directory.mkdir()
    source_file = source_directory / "Mr Bachchan poster.png"
    Image.new("RGB", (24, 32), color="gold").save(source_file)
    original_bytes = source_file.read_bytes()
    monkeypatch.setattr(settings, "MEDIA_STORAGE_DIR", str(tmp_path / "storage"))

    first = import_local_images(db_session, [source_directory])
    second = import_local_images(db_session, [source_directory])
    media = db_session.query(Media).filter(Media.source_name == "Project upload").one()

    assert first["imported_count"] == 1
    assert second["imported_count"] == 0
    assert second["skipped_count"] == 1
    assert second["reclassified_count"] == 0
    assert first["failed_items"] == []
    assert media.category == "mr-bachchan"
    assert media.review_status == "approved"
    assert media.local_path and (Path(settings.MEDIA_STORAGE_DIR) / media.local_path).is_file()
    assert source_file.read_bytes() == original_bytes


def test_uncategorized_local_image_is_queued_for_review(db_session, tmp_path, monkeypatch):
    source_directory = tmp_path / "Photos"
    source_directory.mkdir()
    source_file = source_directory / "SaveClip.App_unknown.jpg"
    Image.new("RGB", (24, 32), color="gold").save(source_file)
    monkeypatch.setattr(settings, "MEDIA_STORAGE_DIR", str(tmp_path / "storage"))

    result = import_local_images(db_session, [source_directory])
    media = db_session.query(Media).filter(Media.source_name == "Project upload").one()

    assert result["imported_count"] == 1
    assert result["manual_review_items"][0]["media_type"] == "photo"
    assert media.category == "other"
    # Project-owned uploads are always approved even when uncategorized;
    # they appear in manual_review_items so curators can fix the category,
    # but they must be publicly visible from the start.
    assert media.review_status == "approved"


def test_import_transposes_exif_oriented_images_without_changing_source(
    db_session, tmp_path, monkeypatch
):
    source_directory = tmp_path / "Photos"
    source_directory.mkdir()
    source_file = source_directory / "rotated portrait.jpg"
    image = Image.new("RGB", (24, 32), color="gold")
    exif = image.getexif()
    exif[274] = 6
    image.save(source_file, exif=exif)
    original_bytes = source_file.read_bytes()
    monkeypatch.setattr(settings, "MEDIA_STORAGE_DIR", str(tmp_path / "storage"))

    result = import_local_images(db_session, [source_directory])
    media = db_session.query(Media).filter(Media.source_name == "Project upload").one()
    stored_image = Image.open(Path(settings.MEDIA_STORAGE_DIR) / media.local_path)
    thumbnail = Image.open(Path(settings.MEDIA_STORAGE_DIR) / media.thumbnail_path)

    assert result["imported_count"] == 1
    assert (media.width, media.height) == (32, 24)
    assert stored_image.size == (32, 24)
    assert thumbnail.size == (32, 24)
    assert stored_image.getexif().get(274, 1) == 1
    assert source_file.read_bytes() == original_bytes


def test_unapproved_image_requires_admin(client, db_session, admin_token_headers, tmp_path, monkeypatch):
    image_bytes = b"private image data"
    storage_directory = tmp_path / "storage"
    (storage_directory / "images").mkdir(parents=True)
    (storage_directory / "images" / "private.jpg").write_bytes(image_bytes)
    monkeypatch.setattr(settings, "MEDIA_STORAGE_DIR", str(storage_directory))
    media = Media(
        title="Private image",
        source_url="",
        source_name="Project upload",
        direct_image_url="",
        local_path="images/private.jpg",
        mime_type="image/jpeg",
        category="portraits",
        review_status="pending",
    )
    db_session.add(media)
    db_session.commit()

    assert client.get(f"/api/media/{media.id}/image").status_code == 403
    admin_response = client.get(
        f"/api/media/{media.id}/image", headers=admin_token_headers
    )
    assert admin_response.status_code == 200
    assert admin_response.content == image_bytes


def test_public_thumbnail_uses_jpeg_content_type(client, db_session, tmp_path, monkeypatch):
    storage_directory = tmp_path / "storage"
    (storage_directory / "thumbnails").mkdir(parents=True)
    (storage_directory / "thumbnails" / "thumb_photo.avif").write_bytes(b"thumbnail")
    monkeypatch.setattr(settings, "MEDIA_STORAGE_DIR", str(storage_directory))
    media = Media(
        title="Approved image",
        source_url="",
        source_name="Project upload",
        direct_image_url="",
        local_path="images/photo.avif",
        thumbnail_path="thumbnails/thumb_photo.avif",
        mime_type="image/avif",
        category="portraits",
        review_status="approved",
    )
    db_session.add(media)
    db_session.commit()

    response = client.get(f"/api/media/{media.id}/image?thumbnail=true")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/jpeg")


def test_local_video_import_is_incremental_and_preserves_source(db_session, tmp_path):
    source_directory = tmp_path / "Photos"
    source_directory.mkdir()
    source_file = source_directory / "WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4"
    original_bytes = b"sample local video bytes"
    source_file.write_bytes(original_bytes)

    first = import_local_videos(db_session, [source_directory])
    second = import_local_videos(db_session, [source_directory])
    video = db_session.query(Video).filter(Video.provider == "local").one()

    assert first["imported_count"] == 1
    assert first["manual_review_items"] == []
    assert second["imported_count"] == 0
    assert second["skipped_count"] == 1
    assert second["failed_items"] == []
    assert video.category == "reels"
    assert video.review_status == "approved"
    assert video.local_path == "Photos/WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4"
    assert video.file_size == len(original_bytes)
    assert video.sha256_hash
    assert source_file.read_bytes() == original_bytes


def test_uncategorized_local_video_is_queued_for_review(db_session, tmp_path):
    source_directory = tmp_path / "Photos"
    source_directory.mkdir()
    source_file = source_directory / "SaveClip.App_unknown.mp4"
    source_file.write_bytes(b"unidentified local clip")

    result = import_local_videos(db_session, [source_directory])
    video = db_session.query(Video).filter(Video.provider == "local").one()

    assert result["imported_count"] == 1
    assert result["manual_review_items"][0]["media_type"] == "video"
    assert video.category == "other"
    # Project-owned uploads are always approved even when uncategorized;
    # they appear in manual_review_items so curators can fix the category,
    # but they must be publicly visible from the start.
    assert video.review_status == "approved"
