from typing import List, Dict, Any, Optional
import imagehash
from sqlalchemy.orm import Session
from app.models.media import Media

DEFAULT_HAMMING_THRESHOLD = 8  # Distances <= 8 are visual duplicates (out of 64 bits)

def calculate_hash_distance(phash1: str, phash2: str) -> Optional[int]:
    """Calculate hamming distance between two hex perceptual hashes."""
    if not phash1 or not phash2:
        return None
    try:
        h1 = imagehash.hex_to_hash(phash1)
        h2 = imagehash.hex_to_hash(phash2)
        return h1 - h2
    except Exception:
        return None

def find_duplicate_pairs(
    db: Session,
    hamming_threshold: int = DEFAULT_HAMMING_THRESHOLD
) -> List[Dict[str, Any]]:
    """
    Scan all media records in the database to detect identical (SHA-256)
    and visually similar (Perceptual Hash) duplicates.
    Returns a list of duplicate pairs with comparison metrics.
    """
    media_records = db.query(Media).all()
    duplicates: List[Dict[str, Any]] = []
    seen_pairs = set()

    for i in range(len(media_records)):
        m1 = media_records[i]
        for j in range(i + 1, len(media_records)):
            m2 = media_records[j]
            pair_key = (min(m1.id, m2.id), max(m1.id, m2.id))
            if pair_key in seen_pairs:
                continue

            # Check exact SHA-256 match
            if m1.sha256_hash and m2.sha256_hash and m1.sha256_hash == m2.sha256_hash:
                seen_pairs.add(pair_key)
                duplicates.append({
                    "media_a": m1,
                    "media_b": m2,
                    "similarity_type": "exact_sha256",
                    "hamming_distance": 0,
                    "similarity_score": 1.0,
                    "reason": "Exact file match (identical SHA-256 checksum)"
                })
                continue

            # Check visual similarity via perceptual hash
            if m1.perceptual_hash and m2.perceptual_hash:
                dist = calculate_hash_distance(m1.perceptual_hash, m2.perceptual_hash)
                if dist is not None and dist <= hamming_threshold:
                    seen_pairs.add(pair_key)
                    score = round(1.0 - (dist / 64.0), 4)
                    duplicates.append({
                        "media_a": m1,
                        "media_b": m2,
                        "similarity_type": "visual_phash",
                        "hamming_distance": dist,
                        "similarity_score": score,
                        "reason": f"Visually similar image (Hamming distance {dist}/64, {score*100:.1f}% match)"
                    })

    return duplicates

def check_single_against_library(
    sha256: Optional[str],
    phash: Optional[str],
    db: Session,
    hamming_threshold: int = DEFAULT_HAMMING_THRESHOLD
) -> Optional[Dict[str, Any]]:
    """Check whether a single prospective image is already a duplicate in the database."""
    if sha256:
        exact = db.query(Media).filter(Media.sha256_hash == sha256).first()
        if exact:
            return {
                "existing_media_id": exact.id,
                "similarity_type": "exact_sha256",
                "similarity_score": 1.0,
                "title": exact.title,
            }

    if phash:
        existing_with_phash = db.query(Media).filter(Media.perceptual_hash.isnot(None)).all()
        for item in existing_with_phash:
            dist = calculate_hash_distance(phash, item.perceptual_hash)
            if dist is not None and dist <= hamming_threshold:
                return {
                    "existing_media_id": item.id,
                    "similarity_type": "visual_phash",
                    "hamming_distance": dist,
                    "similarity_score": round(1.0 - (dist / 64.0), 4),
                    "title": item.title,
                }

    return None
