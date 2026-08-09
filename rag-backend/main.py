from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
# Trigger reload 2
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from config import settings
from ingester import process_and_upsert_product
from rag_chain import answer_query_with_rag
from evaluator import RAGEvaluator
from routers.auth import auth_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise RAG Chatbot API for Modena E-Commerce Platform"
)

# Include Auth & Session Router
app.include_router(auth_router)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---
class ProductWebhookPayload(BaseModel):
    id: Optional[Any] = None
    name: str = Field(..., json_schema_extra={"example": "Modena Sindoor 990W Mixer Grinder"})
    price: Any = Field(..., json_schema_extra={"example": 2500})
    category: Optional[str] = Field("Electronics", json_schema_extra={"example": "Electronics"})
    description: Optional[str] = Field("", json_schema_extra={"example": "Heavy duty 990W mixer grinder with dual airflow cooling"})
    specifications: Optional[str] = Field("", json_schema_extra={"example": "100% copper motor, 3 stainless steel jars"})
    sku: Optional[str] = Field("", json_schema_extra={"example": "MOD-MIX-990"})
    permalink: Optional[str] = Field("", json_schema_extra={"example": "https://modena.local/product/mixer"})

class ChatRequest(BaseModel):
    session_id: str = Field(..., json_schema_extra={"example": "sess_987654321"})
    message: str = Field(..., json_schema_extra={"example": "Tell me about the Modena mixer grinder price and motor wattage."})

# --- Endpoints ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Modena API Backend is running smoothly"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}

@app.post("/api/v1/webhook/woocommerce/product-update")
def woocommerce_product_webhook(payload: ProductWebhookPayload, background_tasks: BackgroundTasks):
    """
    Automated Document Ingestion & Vector DB (The Product Sync)
    Webhook endpoint listening for new or updated products from WooCommerce.
    Extracts metadata, chunks text, generates embeddings, and upserts into ChromaDB.
    """
    product_dict = payload.model_dump()
    result = process_and_upsert_product(product_dict)
    return {
        "success": True,
        "message": "Product payload successfully indexed into ChromaDB vector database.",
        "data": result
    }

@app.post("/api/v1/chat/assistant")
def chat_assistant(request: ChatRequest):
    """
    RAG Retrieval & Memory Management
    Embeds user query, performs similarity search (top-k=4) in ChromaDB, applies
    session buffer memory, and returns grounded response or Escalate-to-Human JSON payload.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    response = answer_query_with_rag(
        session_id=request.session_id,
        query=request.message.strip()
    )
    return response

@app.get("/api/v1/admin/rag-eval")
def get_rag_evaluation():
    """
    Evaluation & Analytics Module
    Admin endpoint evaluating recent chat logs for:
    - Accuracy (Did it hallucinate?)
    - Coherence (Was the conversation logical?)
    - Engagement (Session length, product recommendations, escalation rate)
    """
    metrics = RAGEvaluator.evaluate_metrics()
    return {
        "status": "success",
        "metrics": metrics
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
