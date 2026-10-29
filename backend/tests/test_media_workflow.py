from app.models.media import Media

def test_public_media_filters_only_approved(client, db_session):
    m_approved = Media(
        title="Public Approved Photo",
        source_url="https://source.org/app",
        source_name="Source A",
        direct_image_url="https://source.org/app.jpg",
        category="portraits",
        review_status="approved",
    )
    m_pending = Media(
        title="Private Pending Photo",
        source_url="https://source.org/pen",
        source_name="Source B",
        direct_image_url="https://source.org/pen.jpg",
        category="portraits",
        review_status="pending",
    )
    db_session.add(m_approved)
    db_session.add(m_pending)
    db_session.commit()

    # Public unauthenticated request
    resp = client.get("/api/media")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Public Approved Photo"

def test_admin_approve_and_exclude(client, db_session, admin_token_headers):
    m = Media(
        title="Test Item",
        source_url="https://source.org/test",
        source_name="Source X",
        direct_image_url="https://source.org/test.jpg",
        category="casual",
        review_status="pending",
    )
    db_session.add(m)
    db_session.commit()

    # Approve
    resp = client.post(f"/api/media/{m.id}/approve", headers=admin_token_headers)
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "approved"

    # Exclude
    resp = client.post(f"/api/media/{m.id}/exclude", headers=admin_token_headers)
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "excluded"

def test_bulk_action_approve(client, db_session, admin_token_headers):
    m1 = Media(title="Item 1", source_url="u1", source_name="s", direct_image_url="i1", review_status="pending")
    m2 = Media(title="Item 2", source_url="u2", source_name="s", direct_image_url="i2", review_status="pending")
    db_session.add(m1)
    db_session.add(m2)
    db_session.commit()

    resp = client.post(
        "/api/media/bulk-action",
        json={"media_ids": [m1.id, m2.id], "action": "approve"},
        headers=admin_token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["affected_count"] == 2

    db_session.refresh(m1)
    db_session.refresh(m2)
    assert m1.review_status == "approved"
    assert m2.review_status == "approved"
