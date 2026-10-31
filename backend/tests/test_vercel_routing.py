import pytest
from starlette.testclient import TestClient
from api.index import app, clean_vercel_path


@pytest.fixture
def client():
    return TestClient(app)


def test_clean_vercel_path_unit():
    assert clean_vercel_path("") == "/"
    assert clean_vercel_path("/") == "/"
    assert clean_vercel_path("/api/index.py") == "/"
    assert clean_vercel_path("/api/index.py/") == "/"
    assert clean_vercel_path("/api/index") == "/"
    assert clean_vercel_path("/api/index/") == "/"
    assert clean_vercel_path("/api/index.py/api/health") == "/api/health"
    assert clean_vercel_path("/api/index.py/docs") == "/docs"
    assert clean_vercel_path("/api/index.py/openapi.json") == "/openapi.json"
    assert clean_vercel_path("/api/index.py/api/media/browse") == "/api/media/browse"
    assert clean_vercel_path("api/index.py/api/health") == "/api/health"
    assert clean_vercel_path("/api/index.py//docs") == "/docs"
    assert clean_vercel_path("/api/index/api/health") == "/api/health"
    assert clean_vercel_path("/api/health?param=1") == "/api/health"


def test_direct_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["version"] == "1.0.0"


def test_direct_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_direct_docs(client):
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_direct_openapi(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data


# Tests simulating Vercel destination path routing (/api/index.py/$1)
def test_vercel_destination_routing_root(client):
    # When requesting / with /api/index.py/$1, Vercel routes to /api/index.py/
    response = client.get("/api/index.py/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vercel_destination_routing_root_no_trailing_slash(client):
    # When requesting / with /api/index.py/$1, Vercel routes to /api/index.py
    response = client.get("/api/index.py")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vercel_destination_routing_health(client):
    # When requesting /api/health with /api/index.py/$1, Vercel routes to /api/index.py/api/health
    response = client.get("/api/index.py/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_vercel_destination_routing_docs(client):
    # When requesting /docs with /api/index.py/$1, Vercel routes to /api/index.py/docs
    response = client.get("/api/index.py/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_vercel_destination_routing_openapi(client):
    # When requesting /openapi.json with /api/index.py/$1, Vercel routes to /api/index.py/openapi.json
    response = client.get("/api/index.py/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert data["info"]["title"] == "A World of Bhagyashri - Fan API"


def test_vercel_destination_routing_nested_router(client):
    # Nested router endpoint /api/media via destination path
    response = client.get("/api/index.py/api/media")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data

    # Nested router endpoint /api/videos via destination path
    response_videos = client.get("/api/index.py/api/videos")
    assert response_videos.status_code == 200
    assert isinstance(response_videos.json(), list)


def test_vercel_with_edge_headers_root(client):
    # Vercel with x-matched-path: /
    response = client.get("/api/index.py", headers={"x-matched-path": "/"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vercel_with_edge_headers_health(client):
    # Vercel with x-matched-path: /api/health
    response = client.get("/api/index.py", headers={"x-matched-path": "/api/health"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_vercel_with_rewritten_edge_headers(client):
    # Vercel with x-matched-path: /api/index.py/api/health
    response = client.get("/api/index.py/api/health", headers={"x-matched-path": "/api/index.py/api/health"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
