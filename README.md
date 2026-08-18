# 🍳 Modena E-Commerce Platform & RAG AI Chatbot Assistant Pipeline

A production-ready Headless E-Commerce storefront for **Modena Kitchenware**, powered by a **React + Vite** frontend, **Headless WordPress + WooCommerce** backend (with JWT Auth & OTP verification), and a **FastAPI + LangChain + ChromaDB** Retrieval-Augmented Generation (RAG) AI Chatbot Assistant.

---

## 🌟 System Architecture & Key Features

```
               ┌─────────────────────────────────────────┐
               │    Modena React Storefront (Vite)       │
               │         http://localhost:5173           │
               └────────────┬──────────────┬─────────────┘
                            │              │
        JWT / REST / OTP    │              │  RAG Chatbot API
            Requests        │              │  /api/v1/chat/assistant
                            ▼              ▼
┌────────────────────────────────┐   ┌────────────────────────────────┐
│  Headless WordPress / Woo      │   │  FastAPI RAG AI Backend        │
│  http://modena.local           │   │  http://127.0.0.1:8000         │
│  - WooCommerce Store REST API  │   │  - LangChain Session Memory    │
│  - JWT Authentication          │   │  - ChromaDB Vector Storage     │
│  - Custom OTP & User Endpoints │   │  - Human Escalation Rules      │
│  - Razorpay Payment REST API   │   │  - Evaluation & Analytics      │
└────────────────────────────────┘   └────────────────────────────────┘
```

### 1. 🛍️ Headless Storefront & User Auth
- **Modern UI/UX**: Built with React 19, TailwindCSS v4, and Lucide React icons.
- **Multi-Step User Authentication**:
  - Automatically detects whether an email exists in WordPress.
  - Generates and verifies **6-digit OTP codes** for new user sign-ups (`/wp-json/modena/v1/send-otp` & `/wp-json/modena/v1/verify-otp-register`).
  - Native **JWT Authentication** (`/wp-json/jwt-auth/v1/token`) storing tokens in `localStorage`.
- **Payment Gateway Integration**: Custom REST API endpoints for **Razorpay** order session creation and payment verification.

### 2. 🤖 RAG AI Chatbot Assistant (`rag-backend/`)
- **FastAPI Core**: Lightweight asynchronous web framework powering AI endpoints.
- **ChromaDB Vector Store**: Persistent vector database indexing Modena product names, categories, prices, and specifications using 384-dimensional dense embeddings (`FastDeterministicEmbeddingFunction`).
- **WooCommerce Product Sync Webhook**: `POST /api/v1/webhook/woocommerce/product-update` extracts product metadata, chunks content, and upserts dense vectors into ChromaDB (`modena_products_v1`).
- **Contextual Session Buffer Memory**: Tracks conversation context per `session_id` up to `MAX_SESSION_HISTORY`.
- **Human Escalation Guardrails**: Automatically detects complaints or explicit requests for human support and triggers human customer specialist routing.
- **Evaluation & Analytics Engine**: Logs accuracy, coherence, and engagement metrics to `rag_analytics.json`, accessible via `GET /api/v1/admin/rag-eval`.

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+
- **Local WP / WordPress**: WooCommerce installed on `http://modena.local`

---

### Step 1: Run the RAG FastAPI Backend

```bash
# Navigate to the rag-backend directory
cd rag-backend

# Install required Python dependencies
pip install fastapi uvicorn pydantic langchain chromadb pytest

# Start the FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- **Swagger API Documentation**: Visit `http://127.0.0.1:8000/docs` in your browser.

---

### Step 2: Run the React Storefront

```bash
# In the theme root directory
npm install

# Start the Vite development server
npm run dev
```

- **Storefront URL**: Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing Suite

Run the PyTest suite to verify health checks, WooCommerce webhook document ingestion, RAG chat assistant similarity search, human escalation triggers, and evaluation endpoints:

```bash
cd rag-backend
python -m pytest tests/test_rag_pipeline.py -v
```

**Expected Result**: `5 passed in ~2.4s (100%)`.

---

## 📡 API Endpoint Overview

### 🤖 RAG AI Chatbot Assistant API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/chat/assistant` | Main RAG chat query endpoint with top-k=4 search and session memory. |
| `POST` | `/api/v1/webhook/woocommerce/product-update` | Webhook endpoint for WooCommerce product chunking & vector DB upserting. |
| `GET` | `/api/v1/admin/rag-eval` | Admin evaluation metrics & interaction analytics. |
| `GET` | `/health` | RAG service health check. |

### 🔐 Headless WordPress & Authentication API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/wp-json/jwt-auth/v1/token` | Obtain JWT authorization token for WP REST API. |
| `POST` | `/wp-json/jwt-auth/v1/token/validate` | Validate active JWT token. |
| `POST` | `/wp-json/modena/v1/check-user-exists` | Check if user email is registered in WordPress. |
| `POST` | `/wp-json/modena/v1/send-otp` | Generate and dispatch 6-digit account verification OTP. |
| `POST` | `/wp-json/modena/v1/verify-otp-register` | Validate OTP and create new customer account in WordPress. |
| `POST` | `/wp-json/modena/v1/create-razorpay-order` | Create Razorpay payment session ID. |
| `POST` | `/wp-json/modena/v1/verify-razorpay-payment` | Verify Razorpay payment transaction. |

---

## 🛠️ Configuration & Environment Variables

### `rag-backend/config.py`
```python
CHROMA_PERSIST_DIRECTORY = "./chroma_db"
COLLECTION_NAME = "modena_products_v1"
CONFIDENCE_THRESHOLD = 0.3
TOP_K = 4
MAX_SESSION_HISTORY = 5
```

### `wp-config.php`
```php
define( 'JWT_AUTH_SECRET_KEY', 'modena-jwt-secure-key-9f8e7d6c5b4a3210-2026-auth' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```

---

## 📄 License
This project is proprietary code developed for **Modena Kitchenware Ltd.** All rights reserved.
