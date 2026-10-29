import json
from app.models.media import Media

def test_export_json(client, db_session, admin_token_headers):
    m = Media(
        title="Export Test Media",
        source_url="https://source.org/test",
        source_name="Source Test",
        direct_image_url="https://source.org/test.jpg",
        category="portraits",
        review_status="approved",
    )
    db_session.add(m)
    db_session.commit()

    resp = client.get("/api/export/json", headers=admin_token_headers)
    assert resp.status_code == 200
    data = json.loads(resp.text)
    assert data["exported_count"] == 1
    assert data["media"][0]["title"] == "Export Test Media"

def test_export_csv(client, db_session, admin_token_headers):
    m = Media(
        title="CSV Test Media",
        source_url="https://source.org/test",
        source_name="Source Test",
        direct_image_url="https://source.org/test.jpg",
        category="traditional",
        review_status="approved",
    )
    db_session.add(m)
    db_session.commit()

    resp = client.get("/api/export/csv", headers=admin_token_headers)
    assert resp.status_code == 200
    csv_text = resp.text
    assert "CSV Test Media" in csv_text
    assert "traditional" in csv_text

def test_gallery_manifest_generation(client, db_session):
    m = Media(
        title="Manifest Photo",
        source_url="https://source.org/man",
        source_name="Source Test",
        direct_image_url="https://source.org/man.jpg",
        category="lenin",
        review_status="approved",
        is_featured=True,
    )
    db_session.add(m)
    db_session.commit()

    resp = client.post("/api/export/manifest")
    assert resp.status_code == 200
    manifest = resp.json()
    assert manifest["total_items"] == 1
    assert manifest["gallery"][0]["title"] == "Manifest Photo"
