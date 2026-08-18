import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_oversized_request_body_rejected_413():
    """Verify that requests exceeding 2MB are rejected with HTTP 413"""
    headers = {"Content-Length": "3000000"} # 3MB header
    response = client.post(
        "/api/v1/chat/assistant",
        headers=headers,
        content=b"x" * 100
    )
    assert response.status_code == 413
    data = response.json()
    assert "exceeds maximum allowed size" in data.get("detail", "")

def test_chat_invalid_session_id_format_422():
    """Verify that malformed session IDs with special characters or paths are rejected"""
    # Malicious path traversal / special characters
    payload = {
        "session_id": "../../etc/passwd",
        "message": "Hello Modena"
    }
    response = client.post("/api/v1/chat/assistant", json=payload)
    assert response.status_code == 422

def test_chat_oversized_message_422():
    """Verify that chat messages exceeding 2000 characters are rejected"""
    payload = {
        "session_id": "sess_normal_123",
        "message": "A" * 2500
    }
    response = client.post("/api/v1/chat/assistant", json=payload)
    assert response.status_code == 422

def test_auth_invalid_email_phone_422():
    """Verify that malformed or oversized auth inputs are rejected"""
    # Oversized identifier (> 254 chars)
    payload = {
        "identifier": ("a" * 260) + "@example.com"
    }
    response = client.post("/api/v1/auth/check-identifier", json=payload)
    assert response.status_code == 422

def test_otp_invalid_channel_enum_422():
    """Verify that non-allowlisted communication channels are rejected"""
    payload = {
        "phone_number": "+919962105345",
        "channel": "carrier_pigeon" # Invalid channel
    }
    response = client.post("/api/v1/auth/login/phone-otp-request", json=payload)
    assert response.status_code == 422

def test_cart_merge_excessive_array_422():
    """Verify that excessive nested arrays (> 100 items) are rejected"""
    payload = {
        "user_id": "usr_valid_123",
        "items": [{"id": f"p_{i}", "name": "Pot", "quantity": 1} for i in range(150)]
    }
    response = client.post("/api/v1/cart/merge", json=payload)
    assert response.status_code == 422

def test_valid_chat_query_accepted_200():
    """Verify that well-formed, size-limited queries are accepted and processed properly"""
    payload = {
        "session_id": "sess_valid_456",
        "message": "What is the warranty period for Modena Cookware?"
    }
    response = client.post("/api/v1/chat/assistant", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data or "reply" in data or "response" in data
