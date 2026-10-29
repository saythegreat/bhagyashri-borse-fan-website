# A World of Bhagyashri
### Complete Full-Stack Fan Tribute & Automatic Media Discovery System

> *"Some smiles stay in your heart forever."*

An elegant, cinematic, interactive fan website celebrating Indian actress **Bhagyashri Borse**, her filmography, public appearances, dance numbers, and screen presence. Integrates an **Automatic Media Discovery and Collection Engine** directly into the platform to search, discover, preview, deduplicate, and curate high-resolution media without manual download friction.

---

## Key Highlights & Features

1. **Cinematic Public Experience**:
   - **Homepage**: Muted looping video hero with the original portrait as a loading/error fallback, featured films, curated photographs, video highlights, and fan appreciation letter.
   - **Curated Photo Gallery**: Approved project photographs with category counts, search across the full collection, pagination, favorites, and a keyboard-operable lightbox.
   - **Selected Filmography**: A visual list of selected projects, using photographs from the approved project collection where available.
   - **Dedicated Lenin Archive**: A fan-made collection of approved photographs tagged for the project; check official sources for current production details.
   - **Video Gallery**: Approved local MP4 clips from `Photos` plus configured YouTube entries, with native playback controls and category filters.
   - **Local Favorites**: Instant client-side favorite saving with reactive badge counters, requiring no account creation for public visitors.
   - **Ethical & Legal Clarity**: Prominent disclaimer stating this is an unofficial non-commercial fan tribute, with source attribution on every photograph.

2. **Integrated Automatic Media Discovery & Collector**:
   - **Provider-Based Architecture**:
     - **Wikimedia Commons API**: Built-in, 100% free, open access with full Creative Commons and Public Domain metadata.
     - **Openverse API**: Open-access CC image search engine.
     - **Microsoft Azure Bing Image Search v7**: Full integration ready; gracefully explains missing credentials if unconfigured.
   - **Preset Query Shortcuts**: Quick-search buttons for "Bhagyashri Borse portrait", "traditional look", "photoshoot", "Lenin", "public appearance", "promotional still".
   - **Intelligent Classification**: Automatic category inference rules analyzing titles, tags, and occasions with confidence scores.
   - **Candidate Preview & Rights Check**: Inspect original source URL, licensing terms, reuse status (permitted vs. editorial), dimensions, and MIME types.
   - **Bulk Collection Engine**: Batch import candidate items or download local copies with progress tracking.
   - **Perceptual Duplicate Detection**: Identifies exact duplicates using SHA-256 and visually similar duplicates using 64-bit Perceptual Hashing (pHash) with configurable Hamming distance threshold.
   - **Curator Control**: Discovered media remains pending until review. The repeatable admin-only local scan indexes photos and videos in the existing database, preserves source files and existing records, and places media without a reliable category into a private review queue.
   - **Export Utilities**: Full export in JSON, CSV, Public Gallery Manifest, and ZIP archives of local media.

3. **Production Security**:
   - **SSRF Defense**: Strict validation of remote image URLs blocking private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, link-local `169.254.169.254`). Validates every redirect hop.
   - **File Validation**: Pillow byte-level image header verification, format whitelisting (JPEG, PNG, WebP, AVIF), and 15MB size limits.
   - **Private Media Storage**: No public static storage mount; image delivery checks each record’s approval status.
   - **JWT Authentication**: Password hashing using bcrypt with 12 rounds and signed JWT tokens protecting all collector and management endpoints.

---

## Architecture & Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Framer Motion.
- **Backend**: Python 3.10+, FastAPI, SQLite, SQLAlchemy ORM, Pydantic v2.
- **Image Processing**: Pillow (PIL), ImageHash (perceptual pHash / Hamming distance).
- **Security & Networking**: HTTPX with async transports, bcrypt, PyJWT, custom SSRF validator.
- **Testing**: Pytest with in-memory database isolation and mock external providers.

---

## Quick Start Guide (Windows PowerShell)

### 1. Prerequisites
Ensure you have:
- **Node.js** v18+ (`node -v`)
- **Python** 3.10+ (`python --version`)

---

### 2. Backend Setup & Run

Open a PowerShell terminal in the project root:

```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
Copy-Item .env.example .env

# Initialize database tables, admin account, and configured videos
python seed_data.py

# Start the FastAPI backend server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be available at:
- API Root: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

---

### 3. Frontend Setup & Run

Open a second PowerShell terminal in the project root:

```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies (using npm.cmd on Windows)
npm.cmd install

# Start the Next.js development server on port 3000
npm.cmd run dev
```

Open your browser at **`http://localhost:3000`** to view the website.

To add media in the project `Photos` folder, log in as an administrator and select **Scan Local Photos** in the media library. The scan is repeatable, also searches nested folders, leaves originals untouched, imports videos into the existing video database, and keeps uncertain items private until categorized and approved. The homepage hero uses `Photos/WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4`; the existing `frontend/public/images/bhagyashree-hero.png` remains its poster and playback fallback.

Local video streaming uses the approval-checked FastAPI endpoint. Set `BACKEND_API_URL` in the frontend environment if the API is not available at `http://127.0.0.1:8000/api`.

---

## Administrator Login & Media Collector

1. In your browser, navigate to: **`http://localhost:3000/collector/login`**
2. Use the initial development credentials:
   - **Username**: `admin`
   - **Password**: `BhagyaAdmin@2025!`
3. After logging in, you will be redirected to the **Collector Command Center** (`/collector`), where you can:
   - **Discover Media**: Query Wikimedia Commons and Openverse automatically, filter by category or resolution, and batch-import photos.
   - **Manage Library**: Scan project photos, categorize, edit titles/tags, approve or exclude collected media, feature images, or delete managed copies.
   - **Review Duplicates**: Inspect side-by-side comparisons of duplicate or visually similar images detected via perceptual hashing.
   - **Settings & Exports**: Download complete JSON/CSV metadata, generate the public gallery manifest, or download a ZIP archive.

---

## Configuring Optional External Search APIs (Bing)

By default, the application uses **Wikimedia Commons** and **Openverse**, which require **no API keys**.

To optionally enable Microsoft Azure Bing Image Search v7:
1. Obtain an Azure Cognitive Services Bing Search API key from [portal.azure.com](https://portal.azure.com).
2. Open `backend/.env` and add:
   ```env
   BING_IMAGE_SEARCH_API_KEY="your_actual_key_here"
   ```
3. Restart the backend server. The Bing provider will now show as `Operational` in `/collector/settings`.

---

## Running the Automated Test Suite

To run the backend unit and integration tests (including SSRF, duplicate detection, auth, and approval workflows):

```powershell
cd backend
.\venv\Scripts\pytest.exe -v
```

All tests execute with an isolated in-memory SQLite database without requiring paid external API credentials.

---

## Project Structure

```
BhagyaWebsite/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application & router mounts
│   │   ├── database.py           # SQLAlchemy database session & engine
│   │   ├── config.py             # Pydantic BaseSettings
│   │   ├── core/
│   │   │   ├── security.py       # Password hashing (bcrypt) & JWT tokens
│   │   │   └── dependencies.py   # Auth route guards (get_current_user)
│   │   ├── models/               # Database tables: User, Media, Search, Video, AuditLog
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── base_provider.py      # Abstract provider & category inference engine
│   │   │   ├── wikimedia_provider.py # Wikimedia Commons search integration
│   │   │   ├── openverse_provider.py # Openverse search integration
│   │   │   ├── bing_provider.py      # Azure Bing Image Search v7 integration
│   │   │   ├── ssrf_validator.py     # DNS-level SSRF prevention
│   │   │   ├── media_downloader.py   # Safe streamed remote media downloader
│   │   │   ├── image_processor.py    # Pillow validation, thumbnails, & pHash
│   │   │   ├── duplicate_detector.py # SHA-256 & Perceptual Hash distance scanner
│   │   │   ├── video_service.py      # YouTube URL parser & thumbnail generator
│   │   │   └── export_service.py     # JSON, CSV, manifest, and ZIP export tools
│   │   └── api/                  # API routers: auth, discovery, media, collector, videos, export
│   ├── tests/                    # Comprehensive Pytest suite
│   ├── storage/                  # Categorized local media storage & thumbnails
│   ├── seed_data.py              # Initial DB population script
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Documented configuration template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  # Cinematic Homepage
│   │   │   ├── gallery/page.tsx          # Public Curated Photo Gallery
│   │   │   ├── gallery/[category]/page.tsx # Category Gallery Showcase
│   │   │   ├── filmography/page.tsx      # Verified Acting Career & Credits
│   │   │   ├── movies/lenin/page.tsx     # Dedicated Lenin Movie Tribute
│   │   │   ├── videos/page.tsx           # Video Gallery with Modal Player
│   │   │   ├── favorites/page.tsx        # Personal Local Favorites
│   │   │   ├── about/page.tsx            # Project Mission & Legal Notice
│   │   │   └── collector/                # Private Media Collector Hub
│   │   │       ├── page.tsx              # Overview & Statistics
│   │   │       ├── discover/page.tsx     # Image Search & Ingestion Interface
│   │   │       ├── library/page.tsx      # Media Library & Approval Manager
│   │   │       ├── duplicates/page.tsx   # Perceptual Duplicate Comparator
│   │   │       ├── settings/page.tsx     # API Configuration & Data Exports
│   │   │       └── login/page.tsx        # Administrator Authentication
│   │   ├── components/                   # Navigation, Gallery Cards, Lightbox, Placeholders
│   │   ├── lib/                          # Typed API client & favorites manager
│   │   ├── types/                        # TypeScript domain interfaces
│   │   └── styles/                       # Romantic cinematic design system & globals.css
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
├── docs/                                 # Architecture & design documentation
├── .gitignore
└── README.md
```

---

## Legal & Copyright Notice

**A World of Bhagyashri** is an unofficial fan tribute project created for educational, research, and non-commercial admirer appreciation purposes.

- This website is not authorized, endorsed, or affiliated with Bhagyashri Borse, her management agency, or any film production company.
- All photographs and video clips remain the exclusive property of their respective copyright owners, photographers, and studios.
- Media items indexed via open search engines display source attribution links back to their original hosting platforms.
