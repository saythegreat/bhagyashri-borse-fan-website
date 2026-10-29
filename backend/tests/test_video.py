from app.models.video import Video
from app.services.video_service import extract_youtube_id, normalize_video_entry

def test_extract_youtube_id_formats():
    assert extract_youtube_id("https://www.youtube.com/watch?v=F0k96pI1r0A") == "F0k96pI1r0A"
    assert extract_youtube_id("https://youtu.be/F0k96pI1r0A") == "F0k96pI1r0A"
    assert extract_youtube_id("https://www.youtube.com/embed/F0k96pI1r0A") == "F0k96pI1r0A"
    assert extract_youtube_id("https://www.youtube.com/shorts/F0k96pI1r0A") == "F0k96pI1r0A"
    assert extract_youtube_id("F0k96pI1r0A") == "F0k96pI1r0A"
    assert extract_youtube_id("invalid-url-or-id") is None

def test_video_api_crud(client, admin_token_headers):
    # Add video
    resp = client.post(
        "/api/videos",
        json={
            "title": "Test Promotion",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "category": "promotions",
            "description": "Test description",
            "is_featured": True,
        },
        headers=admin_token_headers,
    )
    assert resp.status_code == 201
    vid_data = resp.json()
    assert vid_data["video_id"] == "dQw4w9WgXcQ"
    assert "hqdefault.jpg" in vid_data["thumbnail_url"]

    # Public list
    list_resp = client.get("/api/videos")
    assert list_resp.status_code == 200
    assert any(v["video_id"] == "dQw4w9WgXcQ" for v in list_resp.json())

def test_unwanted_categories_excluded_from_public_list(client, admin_token_headers):
    # Add a trailer (excluded category)
    resp = client.post(
        "/api/videos",
        json={
            "title": "Secret Trailer",
            "video_url": "https://www.youtube.com/watch?v=9bZkp7q19f0",
            "category": "trailers",
            "description": "Trailer",
            "is_featured": False,
        },
        headers=admin_token_headers,
    )
    assert resp.status_code == 201

    # Public listing must NOT return it
    public_list = client.get("/api/videos").json()
    assert not any(v["video_id"] == "9bZkp7q19f0" for v in public_list)
    assert not any(v["category"] in ("trailers", "songs", "interviews") for v in public_list)

    # Admin query still sees it
    admin_list = client.get("/api/videos", headers=admin_token_headers).json()
    assert any(v["video_id"] == "9bZkp7q19f0" for v in admin_list)

def test_local_video_review_visibility_and_range_stream(
    client, db_session, admin_token_headers, tmp_path, monkeypatch
):
    from app.api import videos as videos_api

    monkeypatch.setattr(videos_api, "PROJECT_ROOT", tmp_path)
    source = tmp_path / "Photos" / "review.mp4"
    source.parent.mkdir()
    source.write_bytes(b"0123456789")
    video = Video(
        title="Review clip",
        provider="local",
        video_url="/media/video-aaaaaaaaaaaaaaaa",
        video_id="aaaaaaaaaaaaaaaa",
        category="other",
        local_path="Photos/review.mp4",
        file_size=10,
        sha256_hash="a" * 64,
        review_status="pending",
    )
    db_session.add(video)
    db_session.commit()

    assert client.get("/api/videos?provider=local").json() == []
    assert client.get("/api/videos/local/aaaaaaaaaaaaaaaa/stream").status_code == 404
    assert client.get(
        "/api/videos/local/aaaaaaaaaaaaaaaa/stream",
        headers={**admin_token_headers, "Range": "bytes=2-5"},
    ).status_code == 206
    preview = client.get(
        "/api/videos/local/aaaaaaaaaaaaaaaa/stream",
        headers={**admin_token_headers, "Range": "bytes=2-5"},
    )
    assert preview.content == b"2345"
    assert preview.headers["content-range"] == "bytes 2-5/10"

    queue = client.get(
        "/api/videos?provider=local&review_status=pending",
        headers=admin_token_headers,
    )
    assert [item["video_id"] for item in queue.json()] == ["aaaaaaaaaaaaaaaa"]
