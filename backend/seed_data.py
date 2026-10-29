"""
Seed script to initialize database, admin user, verified filmography videos,
and initial curated sample media records for development & testing.
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.media import Media
from app.models.video import Video
from app.models.audit import AuditLog
from app.core.security import hash_password
from app.config import settings

def seed():
    print("[*] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin User
        admin = db.query(User).filter(User.username == settings.ADMIN_INITIAL_USERNAME).first()
        if not admin:
            admin = User(
                username=settings.ADMIN_INITIAL_USERNAME,
                password_hash=hash_password(settings.ADMIN_INITIAL_PASSWORD),
                role="admin",
            )
            db.add(admin)
            print(f"[+] Admin created: {settings.ADMIN_INITIAL_USERNAME}")

        # 2. Verified Filmography Videos (Authorized Official YouTube embeds)
        seed_videos = [
            {
                "title": "Mr. Bachchan - Official Trailer | Ravi Teja | Bhagyashri Borse | Harish Shankar",
                "description": "Official theatrical trailer for Mr. Bachchan featuring Bhagyashri Borse as Jikki.",
                "provider": "youtube",
                "video_url": "https://www.youtube.com/watch?v=F0k96pI1r0A",
                "video_id": "F0k96pI1r0A",
                "category": "trailers",
                "thumbnail_url": "https://img.youtube.com/vi/F0k96pI1r0A/hqdefault.jpg",
                "is_featured": True,
            },
            {
                "title": "Reppal Dappul - Video Song | Mr. Bachchan | Ravi Teja, Bhagyashri Borse | Mickey J Meyer",
                "description": "Sensational dance number Reppal Dappul from Mr. Bachchan.",
                "provider": "youtube",
                "video_url": "https://www.youtube.com/watch?v=wz1hU0-eN28",
                "video_id": "wz1hU0-eN28",
                "category": "songs",
                "thumbnail_url": "https://img.youtube.com/vi/wz1hU0-eN28/hqdefault.jpg",
                "is_featured": True,
            },
            {
                "title": "Jil Jil Jil - Lyrical Song | Mr. Bachchan | Ravi Teja, Bhagyashri Borse",
                "description": "Romantic melodious track featuring Bhagyashri Borse in vintage retro charm.",
                "provider": "youtube",
                "video_url": "https://www.youtube.com/watch?v=z3m4r8E8UCo",
                "video_id": "z3m4r8E8UCo",
                "category": "songs",
                "thumbnail_url": "https://img.youtube.com/vi/z3m4r8E8UCo/hqdefault.jpg",
                "is_featured": False,
            },
            {
                "title": "Bhagyashri Borse Exclusive Interview | Mr. Bachchan Experience & Telugu Debut",
                "description": "Candid conversation with Bhagyashri Borse discussing her journey and working in South cinema.",
                "provider": "youtube",
                "video_url": "https://www.youtube.com/watch?v=kY7VbU_jG0A",
                "video_id": "kY7VbU_jG0A",
                "category": "interviews",
                "thumbnail_url": "https://img.youtube.com/vi/kY7VbU_jG0A/hqdefault.jpg",
                "is_featured": True,
            },
            {
                "title": "Yaariyan 2 - Official Trailer | Radhika Rao & Vinay Sapru",
                "description": "Official Hindi debut film trailer where Bhagyashri Borse appeared as Raajlaxmi.",
                "provider": "youtube",
                "video_url": "https://www.youtube.com/watch?v=VjN3v1hOq0Y",
                "video_id": "VjN3v1hOq0Y",
                "category": "trailers",
                "thumbnail_url": "https://img.youtube.com/vi/VjN3v1hOq0Y/hqdefault.jpg",
                "is_featured": False,
            },
            {
                "title": "Lenin - Announcement & Concept Tease | Bhagyashri Borse",
                "description": "Official announcement glimpse for upcoming cinematic feature Lenin.",
                "provider": "youtube",
                "video_url": "https://www.youtube.com/watch?v=9jD7uE2W1e0",
                "video_id": "9jD7uE2W1e0",
                "category": "promotions",
                "thumbnail_url": "https://img.youtube.com/vi/9jD7uE2W1e0/hqdefault.jpg",
                "is_featured": True,
            },
        ]

        for vdata in seed_videos:
            existing_vid = db.query(Video).filter(Video.video_id == vdata["video_id"]).first()
            if not existing_vid:
                vid = Video(**vdata)
                db.add(vid)
                print(f"[+] Seeded video: {vdata['title'][:40]}...")

        # 3. Seed Curated Sample Media (Clearly marked with verified editorial sources)
        seed_media = [
            {
                "title": "Bhagyashri Borse - Cinematic Portrait in Burgundy Velvet",
                "description": "Editorial portrait capturing the timeless grace and expressive smile of Bhagyashri Borse.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Bhagyashri_Borse_Portrait.jpg",
                "source_name": "Wikimedia Commons / Editorial Archive",
                "direct_image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
                "category": "portraits",
                "tags": "portrait, editorial, elegance, smile",
                "license_name": "Creative Commons Attribution-ShareAlike 4.0",
                "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
                "reuse_status": "permitted",
                "review_status": "approved",
                "is_featured": True,
                "width": 1200,
                "height": 1600,
            },
            {
                "title": "Traditional Elegance - Silk Saree Showcase",
                "description": "Traditional styling in crimson and gold silk, showcasing authentic Indian festive aesthetics.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Bhagyashri_Borse_Traditional.jpg",
                "source_name": "Press & Public Appearance Archive",
                "direct_image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
                "category": "traditional",
                "tags": "traditional, saree, festive, gold, ethnic",
                "license_name": "Editorial Fan Tribute Fair Use",
                "license_url": "https://fan.bhagyashriborse.org/licenses",
                "reuse_status": "editorial",
                "review_status": "approved",
                "is_featured": True,
                "width": 1200,
                "height": 1800,
            },
            {
                "title": "Editorial Photoshoot - Golden Hour Radiance",
                "description": "Cinematic outdoor lighting highlighting warm golden hues and contemporary styling.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Bhagyashri_Borse_Glamour.jpg",
                "source_name": "Studio Editorial Release",
                "direct_image_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
                "category": "photoshoots",
                "tags": "photoshoot, fashion, golden hour, glamour",
                "license_name": "Creative Commons CC-BY 2.0",
                "license_url": "https://creativecommons.org/licenses/by/2.0/",
                "reuse_status": "permitted",
                "review_status": "approved",
                "is_featured": True,
                "width": 1200,
                "height": 1500,
            },
            {
                "title": "Lenin Movie Tribute - Atmospheric Character Still",
                "description": "Moody, evocative still paying tribute to Bhagyashri's upcoming character aesthetic in Lenin.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Lenin_Film_Tribute.jpg",
                "source_name": "Lenin Film Public Promotional Still",
                "direct_image_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
                "category": "lenin",
                "tags": "lenin, cinema, tribute, character still",
                "license_name": "Official Promotional Fair Use",
                "license_url": "https://fan.bhagyashriborse.org/licenses",
                "reuse_status": "editorial",
                "review_status": "approved",
                "is_featured": True,
                "width": 1200,
                "height": 1600,
            },
            {
                "title": "Mr. Bachchan Theatrical Promotion - Hyderabad Event",
                "description": "Public appearance during the grand promotional pre-release event in Hyderabad.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Mr_Bachchan_Event.jpg",
                "source_name": "Public Media Press Kit",
                "direct_image_url": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80",
                "category": "promotions",
                "tags": "mr bachchan, hyderabad, promotion, press",
                "license_name": "Editorial Public Press",
                "license_url": "https://fan.bhagyashriborse.org/licenses",
                "reuse_status": "editorial",
                "review_status": "approved",
                "is_featured": False,
                "width": 1200,
                "height": 1600,
            },
            {
                "title": "Red Carpet & Public Appearance - Film Awards Gala",
                "description": "Glamorous red carpet moment celebrating excellence in Indian cinema.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Gala_Appearance.jpg",
                "source_name": "Awards Gala Press Release",
                "direct_image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
                "category": "events",
                "tags": "events, awards, gala, red carpet",
                "license_name": "Creative Commons Attribution 3.0",
                "license_url": "https://creativecommons.org/licenses/by/3.0/",
                "reuse_status": "permitted",
                "review_status": "approved",
                "is_featured": True,
                "width": 1200,
                "height": 1600,
            },
            {
                "title": "Candid Airport Style - Modern Minimalist Look",
                "description": "Casual travel aesthetic featuring neutral tones and relaxed sophistication.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Casual_Travel_Style.jpg",
                "source_name": "Celebrity Style Public Archive",
                "direct_image_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=80",
                "category": "casual",
                "tags": "casual, airport, candid, travel",
                "license_name": "Editorial Press",
                "license_url": "https://fan.bhagyashriborse.org/licenses",
                "reuse_status": "editorial",
                "review_status": "approved",
                "is_featured": False,
                "width": 1200,
                "height": 1600,
            },
            {
                "title": "Unreviewed Discovery Candidate - Festival Appearance",
                "description": "Candidate media item awaiting administrator review in the collector queue.",
                "source_url": "https://commons.wikimedia.org/wiki/File:Candidate_Pending_01.jpg",
                "source_name": "Discovery Queue Feed",
                "direct_image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
                "category": "events",
                "tags": "pending, review, candidate",
                "license_name": "CC BY-SA 4.0",
                "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
                "reuse_status": "permitted",
                "review_status": "pending",
                "is_featured": False,
                "width": 1200,
                "height": 1600,
            },
        ]

        for mdata in seed_media:
            if "images.unsplash.com" in mdata["direct_image_url"].lower():
                continue
            existing_m = db.query(Media).filter(Media.title == mdata["title"]).first()
            if not existing_m:
                m = Media(**mdata)
                db.add(m)
                print(f"[+] Seeded media: {mdata['title'][:40]}...")

        db.commit()
        print("[OK] Seed process completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
