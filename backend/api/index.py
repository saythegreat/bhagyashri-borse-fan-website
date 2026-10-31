import sys
import os

# Ensure the backend root is in sys.path for absolute imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

try:
    from app.main import app as fastapi_app
except Exception as init_err:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    fastapi_app = FastAPI(title="Startup Error Fallback")

    @fastapi_app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    def catch_all(full_path: str):
        # Do not expose exception tracebacks or internal secrets in public production responses
        is_prod = os.getenv("APP_ENV") == "production" or os.getenv("VERCEL") == "1"
        return JSONResponse(
            status_code=500,
            content={
                "detail": "FastAPI initialization failed during cold-start.",
                "error": "Internal Server Error" if is_prod else str(init_err),
            },
        )


def clean_vercel_path(path: str) -> str:
    """
    Normalizes paths rewritten by Vercel serverless function routing.

    When backend framework rewrites target `/api/index.py/$1`, Vercel routes
    requests using the rewritten destination path (e.g. `/api/index.py/api/health`).
    This helper safely strips the internal script prefix so that Starlette/FastAPI
    receives the clean application route.

    Examples:
      '/api/index.py/api/health' -> '/api/health'
      '/api/index.py/docs'       -> '/docs'
      '/api/index.py/openapi.json' -> '/openapi.json'
      '/api/index.py/'           -> '/'
      '/api/index.py'            -> '/'
      '/api/index/api/health'    -> '/api/health'
      '/api/health'              -> '/api/health'
      '/'                        -> '/'
    """
    if not path:
        return "/"

    # Strip query parameters if attached to the path
    path = path.split("?", 1)[0].strip()

    if not path.startswith("/"):
        path = "/" + path

    # Handle direct script execution targets
    if path in ("/api/index.py", "/api/index", "/api/index.py/", "/api/index/"):
        return "/"

    if path.startswith("/api/index.py/"):
        path = path[len("/api/index.py"):]
    elif path.startswith("/api/index/"):
        path = path[len("/api/index"):]

    # Collapse any duplicate slashes (e.g. //docs -> /docs)
    while "//" in path:
        path = path.replace("//", "/")

    if not path.startswith("/"):
        path = "/" + path

    return path


class VercelPathNormalizer:
    """
    ASGI middleware for Vercel Serverless Functions.

    Vercel rewrites (e.g. `/(.*) -> /api/index.py/$1`) route requests using the
    rewritten destination path. This middleware normalizes `scope['path']` and
    `scope['raw_path']` by stripping internal script prefixes and inspecting
    Vercel edge headers (`x-matched-path`, `x-forwarded-uri`), ensuring that
    Starlette/FastAPI route matching resolves `/`, `/api/health`, `/docs`,
    `/openapi.json`, and all nested API routers accurately.
    """

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    def __getattr__(self, name):
        return getattr(self.asgi_app, name)

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            raw_path = scope.get("path", "")

            # Extract lower-case request headers from ASGI scope
            headers = {}
            for k, v in scope.get("headers", []):
                headers[k.lower()] = v

            # 1. Inspect Vercel edge routing headers for original request URI
            matched_header = (
                headers.get(b"x-matched-path")
                or headers.get(b"x-forwarded-uri")
                or headers.get(b"x-original-uri")
                or headers.get(b"x-rewrite-url")
            )

            resolved_path = None
            if matched_header:
                try:
                    decoded = matched_header.decode("utf-8")
                    cleaned = clean_vercel_path(decoded)
                    # Use cleaned header if it has a non-root path or if raw_path is the base script
                    if cleaned != "/" or raw_path in ("/api/index.py", "/api/index", "/api/index.py/", "/api/index/"):
                        resolved_path = cleaned
                except Exception:
                    pass

            # 2. If no header was present (or header was root while raw_path has rewritten path segments),
            # normalize the ASGI raw_path directly:
            if not resolved_path or resolved_path == "/":
                cleaned_raw = clean_vercel_path(raw_path)
                if cleaned_raw != "/":
                    resolved_path = cleaned_raw
                elif not resolved_path:
                    resolved_path = cleaned_raw

            scope["path"] = resolved_path
            scope["raw_path"] = resolved_path.encode("utf-8")

        await self.asgi_app(scope, receive, send)


app = VercelPathNormalizer(fastapi_app)

# Vercel looks for the ASGI / WSGI application instance (app)
__all__ = ["app"]
