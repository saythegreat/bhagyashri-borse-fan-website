from app.services.base_provider import infer_category_from_text
from app.services.image_discovery import get_registered_providers

def test_category_inference_rules():
    assert infer_category_from_text("Bhagyashri Borse in traditional red saree")[0] == "traditional"
    assert infer_category_from_text("Bhagyashri Borse portrait headshot")[0] == "portraits"
    assert infer_category_from_text("Bhagyashri Borse upcoming movie Lenin poster")[0] == "lenin"
    assert infer_category_from_text("Bhagyashri Borse airport candid look")[0] == "casual"
    assert infer_category_from_text("Bhagyashri Borse press event conference")[0] == "events"

def test_list_providers(client, admin_token_headers):
    resp = client.get("/api/discovery/providers", headers=admin_token_headers)
    assert resp.status_code == 200
    providers = resp.json()
    provider_names = [p["name"] for p in providers]
    assert "wikimedia" in provider_names
    assert "openverse" in provider_names
    assert "bing" in provider_names

def test_bing_missing_credentials_graceful_error(client, admin_token_headers):
    # Without BING_IMAGE_SEARCH_API_KEY set, it should return a clear, user-friendly 400 error
    resp = client.post(
        "/api/discovery/search",
        json={"query": "Bhagyashri Borse", "provider": "bing"},
        headers=admin_token_headers,
    )
    assert resp.status_code == 400
    assert "Bing Image Search API key is not configured" in resp.json()["detail"]
