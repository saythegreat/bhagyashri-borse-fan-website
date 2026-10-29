from app.services.ssrf_validator import validate_url_safe

def test_reject_localhost():
    is_safe, reason = validate_url_safe("http://localhost:8080/secret")
    assert not is_safe
    assert "forbidden" in reason.lower()

def test_reject_loopback_ip():
    is_safe, reason = validate_url_safe("http://127.0.0.1/admin")
    assert not is_safe

def test_reject_private_range_192():
    is_safe, reason = validate_url_safe("http://192.168.1.50/photo.jpg")
    assert not is_safe
    assert "private" in reason.lower() or "blocked" in reason.lower()

def test_reject_private_range_10():
    is_safe, reason = validate_url_safe("http://10.0.0.1/internal.png")
    assert not is_safe

def test_reject_cloud_metadata():
    is_safe, reason = validate_url_safe("http://169.254.169.254/latest/meta-data/")
    assert not is_safe

def test_reject_unsupported_scheme():
    is_safe, reason = validate_url_safe("file:///etc/passwd")
    assert not is_safe
    assert "scheme" in reason.lower()

def test_accept_valid_public_domain():
    is_safe, _ = validate_url_safe("https://upload.wikimedia.org/wikipedia/commons/sample.jpg")
    assert is_safe
