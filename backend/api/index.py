import sys
import os

# Ensure the backend root is in sys.path for absolute imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

try:
    from app.main import app
except Exception as init_err:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Startup Error Fallback")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    def catch_all(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "FastAPI initialization failed during cold-start.",
                "error": str(init_err),
                "traceback": traceback.format_exc().splitlines(),
            },
        )

# Vercel looks for the ASGI / WSGI application instance (app)
__all__ = ["app"]
