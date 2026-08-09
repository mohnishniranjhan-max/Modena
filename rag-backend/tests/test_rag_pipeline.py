import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_woocommerce_product_webhook():
    payload = {
        "id": 999,
        "name": "Modena Test Cast Iron Pan",
        "price": 1450,
        "category": "Utensils",
        "description": "Premium 10 inch pre-seasoned cast iron skillet for high heat cooking.",
        "specifications": "Pre-seasoned, 2.5kg weight, dual pour spouts",
        "sku": "MOD-CAST-10"
    }
    response = client.post("/api/v1/webhook/woocommerce/product-update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["chunks_indexed"] > 0

def test_chat_assistant_product_query():
    # First ingest a product
    payload = {
        "id": 26,
        "name": "Modena Sindoor 990W Mixer Grinder",
        "price": 2500,
        "category": "Electronics",
        "description": "Heavy duty 990W copper motor with dual airflow cooling.",
        "specifications": "990W motor, 3 stainless steel jars, 2-year warranty"
    }
    client.post("/api/v1/webhook/woocommerce/product-update", json=payload)

    # Now query the RAG assistant
    chat_payload = {
        "session_id": "test_sess_001",
        "message": "Tell me about the Modena Sindoor 990W Mixer Grinder motor and price."
    }
    response = client.post("/api/v1/chat/assistant", json=chat_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] in ["success", "escalate"]
    if res_data["status"] == "success":
        assert "990W" in res_data["message"] or "Mixer" in res_data["message"]

def test_human_escalation_trigger():
    chat_payload = {
        "session_id": "test_sess_002",
        "message": "I want to speak with a human customer support agent right now."
    }
    response = client.post("/api/v1/chat/assistant", json=chat_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "escalate"
    assert res_data["message"] == "I need to connect you with a human expert."

def test_rag_evaluation_admin_endpoint():
    response = client.get("/api/v1/admin/rag-eval")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "accuracy_score" in data["metrics"]
    assert "coherence_score" in data["metrics"]
    assert "escalation_rate_pct" in data["metrics"]
