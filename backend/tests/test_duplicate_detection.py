from app.models.media import Media
from app.services.duplicate_detector import find_duplicate_pairs, calculate_hash_distance

def test_hash_distance_calculation():
    h1 = "ffff0000ffff0000"
    h2 = "ffff0000ffff0000"
    assert calculate_hash_distance(h1, h2) == 0

    h3 = "ffff0000ffff0001"
    assert calculate_hash_distance(h1, h3) == 1

def test_find_exact_duplicate_pairs(db_session):
    m1 = Media(
        title="Image One",
        source_url="https://source.org/1",
        source_name="Source A",
        direct_image_url="https://source.org/img1.jpg",
        sha256_hash="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        perceptual_hash="ffff0000ffff0000",
        review_status="approved",
    )
    m2 = Media(
        title="Image Two",
        source_url="https://source.org/2",
        source_name="Source B",
        direct_image_url="https://source.org/img2.jpg",
        sha256_hash="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        perceptual_hash="ffff0000ffff0000",
        review_status="pending",
    )
    db_session.add(m1)
    db_session.add(m2)
    db_session.commit()

    duplicates = find_duplicate_pairs(db_session, hamming_threshold=8)
    assert len(duplicates) == 1
    assert duplicates[0]["similarity_type"] == "exact_sha256"
    assert duplicates[0]["similarity_score"] == 1.0

def test_find_perceptual_duplicate_pairs(db_session):
    m1 = Media(
        title="Visual Duplicate A",
        source_url="https://source.org/3",
        source_name="Source C",
        direct_image_url="https://source.org/img3.jpg",
        sha256_hash="1111111111111111111111111111111111111111111111111111111111111111",
        perceptual_hash="ffff0000ffff0000",
        review_status="approved",
    )
    m2 = Media(
        title="Visual Duplicate B",
        source_url="https://source.org/4",
        source_name="Source D",
        direct_image_url="https://source.org/img4.jpg",
        sha256_hash="2222222222222222222222222222222222222222222222222222222222222222",
        perceptual_hash="ffff0000ffff0002",  # 1 bit difference
        review_status="pending",
    )
    db_session.add(m1)
    db_session.add(m2)
    db_session.commit()

    duplicates = find_duplicate_pairs(db_session, hamming_threshold=8)
    assert len(duplicates) == 1
    assert duplicates[0]["similarity_type"] == "visual_phash"
    assert duplicates[0]["hamming_distance"] == 1
    assert duplicates[0]["similarity_score"] > 0.95
