from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import json

from config import settings
from ingester import process_and_upsert_product
from rag_chain import answer_query_with_rag
from evaluator import RAGEvaluator
from routers.auth import auth_router
from rate_limiter import RateLimitMiddleware, rate_limiter

class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    """
    Rejects oversized request bodies before application processing.
    Default max body size: 2MB (2,097,152 bytes)
    """
    def __init__(self, app, max_bytes: int = 2 * 1024 * 1024):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_bytes:
            return Response(
                content=json.dumps({"detail": "Request payload exceeds maximum allowed size (2MB)."}),
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                media_type="application/json"
            )
        return await call_next(request)

class NoStoreCacheMiddleware(BaseHTTPMiddleware):
    """
    Prevents caching of sensitive AI interactions, webhooks, and auth endpoints.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/api/v1/"):
            response.headers["Cache-Control"] = "private, no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise RAG Chatbot API for Modena E-Commerce Platform"
)

# Apply Body Size Limit Middleware (HTTP 413 for oversized requests)
app.add_middleware(MaxBodySizeMiddleware, max_bytes=2 * 1024 * 1024)

# Apply Global and Auth Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware, limiter=rate_limiter)

# Apply Caching Middleware
app.add_middleware(NoStoreCacheMiddleware)

# Include Auth & Session Router
app.include_router(auth_router)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://modena.local"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models with Strict Size Limits ---
class ProductWebhookPayload(BaseModel):
    id: Optional[Any] = None
    name: str = Field(..., min_length=1, max_length=300, json_schema_extra={"example": "Modena Sindoor 990W Mixer Grinder"})
    price: Any = Field(..., json_schema_extra={"example": 2500})
    category: Optional[str] = Field("Electronics", max_length=100, json_schema_extra={"example": "Electronics"})
    description: Optional[str] = Field("", max_length=50000, json_schema_extra={"example": "Heavy duty 990W mixer grinder with dual airflow cooling"})
    specifications: Optional[str] = Field("", max_length=20000, json_schema_extra={"example": "100% copper motor, 3 stainless steel jars"})
    sku: Optional[str] = Field("", max_length=100, json_schema_extra={"example": "MOD-MIX-990"})
    permalink: Optional[str] = Field("", max_length=1000, json_schema_extra={"example": "https://modena.local/product/mixer"})

class ChatRequest(BaseModel):
    session_id: Optional[str] = Field("sess_default", max_length=128, pattern=r"^[a-zA-Z0-9_\-\.]*$", json_schema_extra={"example": "sess_987654321"})
    message: str = Field(..., min_length=1, max_length=2000, json_schema_extra={"example": "Tell me about the Modena mixer grinder price and motor wattage."})
    history: Optional[List[Any]] = Field(default_factory=list)

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
@app.post("/chat")
def chat_assistant(request: ChatRequest):
    """
    RAG Retrieval & Memory Management
    Embeds user query, performs similarity search (top-k=4) in ChromaDB, applies
    session buffer memory, and returns grounded response or Escalate-to-Human JSON payload.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    sess = request.session_id if (request.session_id and request.session_id.strip()) else "sess_default"
    response = answer_query_with_rag(
        session_id=sess,
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
