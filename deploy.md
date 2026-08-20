# 🚀 Modena React Theme & AI Assistant — Complete Deployment Guide

This comprehensive, step-by-step manual outlines the complete deployment lifecycle for installing and configuring the **Modena React WordPress Theme** and the **AI Chatbot RAG Service** on any external or production WordPress server.

---

## 🏛️ System Architecture

```text
                                  CUSTOMER BROWSER
                                         │
                                         ▼
                               ┌───────────────────┐
                               │ Modena React App  │
                               └─────────┬─────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
                   ▼ (Store REST APIs)                         ▼ (HTTP POST /api/v1/chat/assistant)
         ┌───────────────────┐                       ┌───────────────────┐
         │ WordPress Backend │                       │ Python / FastAPI  │
         └─────────┬─────────┘                       └─────────┬─────────┘
                   │                                           │
                   ▼                                           ▼
         ┌───────────────────┐                       ┌───────────────────┐
         │    WooCommerce    │                       │ ChromaDB Vectors  │
         │  (Products, Cart, │                       └─────────┬─────────┘
         │  Orders, Checkout)│                                 │
         └─────────┬─────────┘                                 ▼
                   │                                 ┌───────────────────┐
                   ▼                                 │ Google Gemini AI  │
         ┌───────────────────┐                       └───────────────────┘
         │ Payment Gateways  │
         │(Razorpay / BACS)  │
         └───────────────────┘
```

1. **WordPress & WooCommerce Subsystem**:
   * Products, Image Galleries, and Technical Specifications
   * Categories (`Mixer Grinder`, `Nutrimix`, `Cookware`)
   * Authoritative Cart & Line Item Calculations
   * Order Placement (`POST /wp-json/modena/v1/create-wc-order`)
   * Payment Gateway processing (Razorpay, BACS, Cheque)
2. **React + AI Chatbot Subsystem**:
   * Dynamic Single-Page App (SPA) Storefront
   * Interactive `[ - ] [ <QTY> IN CART ] [ + ]` quantity controls
   * FastAPI RAG Server (`/api/v1/chat/assistant`)
   * Grounded retrieval from ChromaDB vector store powered by Gemini

---

## 📦 PHASE 1 — Prepare & Package the Project

### Step 1: Run the Production Build
Open your terminal in `modena-react-theme` and run:
```bash
npm install
npm run build
```
> [!IMPORTANT]
> Ensure the build succeeds with **0 errors**. If `npm run build` fails, resolve the build error locally before proceeding.

### Step 2: Create the Clean Theme ZIP
Generate a production-ready zip archive excluding developer dependencies, git files, and sensitive secrets:

```powershell
Compress-Archive -Path "assets", "catalog_assets", "dist", "inc", "parts", "templates", "functions.php", "index.html", "index.php", "style.css", "theme.json", "package.json", "README.md", "deploy.md", "MODENA_PRODUCT_IMPORT_GUIDE.md", "WOOCOMMERCE_PAYMENT_SETUP.md", "WEBSITE_FULL_TEST_REPORT.md" -DestinationPath "..\modena-react-theme.zip" -Force
```

> [!CAUTION]
> **Strict Exclusions**: Never include `node_modules/`, `.git/`, `_project_extras/`, `.env`, `.env.local`, API keys, or development databases inside the theme ZIP.

---

## 🌐 PHASE 2 — Install & Activate on Target WordPress

Provide `modena-react-theme.zip` to the WordPress site administrator.

### Step 3: Upload & Activate the Theme
**Method A: Via WordPress Admin (Recommended)**
1. Log into the target **WordPress Admin Dashboard** (`https://yourdomain.com/wp-admin`).
2. Navigate to **Appearance → Themes**.
3. Click **Add New Theme** → **Upload Theme**.
4. Choose `modena-react-theme.zip` and click **Install Now**.
5. Once uploaded, click **Activate**.

**Method B: Via FTP / cPanel / File Manager**
1. Extract the folder into `/wp-content/themes/modena-react-theme/`.
2. Go to **Appearance → Themes** in WordPress Admin and activate **Modena React Theme**.

---

## 🔌 PHASE 3 — Install Required Plugins & Configure Payments

### Step 4: Install Required WordPress Plugins
1. **WooCommerce** *(Mandatory)*:
   * Go to **Plugins → Add New Plugin**, search for `WooCommerce`, install and activate it.
   * Set the store currency to **Indian Rupee (₹, INR)**.
2. **Razorpay for WooCommerce** *(For online UPI & Card payments)*:
   * Install and activate `WooCommerce Razorpay` from the WordPress Plugin Directory.

### Step 5: Configure Payment Gateways
1. In WordPress Admin, navigate to **WooCommerce → Settings → Payments**.
2. **Razorpay**:
   * Click **Manage**, enter your live **Key ID** and **Key Secret** from your [Razorpay Dashboard](https://dashboard.razorpay.com/).
3. **Direct Bank Transfer (BACS)** *(Optional)*:
   * Enable if accepting direct NEFT/RTGS wire transfers and specify account details.
4. **Cash on Delivery**:
   * Ensure Cash on Delivery is disabled *(the theme automatically filters out COD)*.
5. Go to **Settings → Permalinks**, select **Post name**, and click **Save Changes** *(Flushes REST API routes)*.

---

## 📥 PHASE 4 — Import Catalog via Modena Product Importer

1. In WordPress Admin, navigate to **Products → Modena Importer** in the sidebar.
2. Click **Browse File from Computer** and select your catalog CSV (supports up to 500MB and Base64 images).
3. Click **Upload & Configure Column Mapping →** to monitor upload speed (`MB/s` and `Mbps`).
4. Click **Validate & Preview Data →**, select **Update Existing Product**, and click **Start Safe Product Import Now**.
5. The importer will automatically:
   * Decode and attach all featured and gallery images to the Media Library.
   * Map items to the official categories: **Mixer Grinder**, **Nutrimix**, and **Cookware**.
   * Populate custom technical specifications, included components, dimensions, and USPs.

---

## 🤖 PHASE 5 — Deploy the AI Chatbot RAG Service (Optional / Recommended)

On the hosting server where Python is available:

### Step 6: Backend Setup & Vector DB Indexing
1. Navigate to the `rag-backend/` folder:
   ```bash
   cd rag-backend
   pip install -r requirements.txt
   ```
2. Configure `.env`:
   ```ini
   GEMINI_API_KEY=your_google_gemini_api_key_here
   CHROMA_PERSIST_DIR=./chroma_db
   TOP_K=4
   MAX_SESSION_HISTORY=10
   ```
3. Sync the WooCommerce catalog into ChromaDB:
   ```bash
   python sync_rag_catalog.py
   ```
4. Start the server with a process manager (PM2 or Systemd):
   ```bash
   pm2 start "python -m uvicorn main:app --host 0.0.0.0 --port 8000" --name modena-ai-rag
   pm2 save
   ```

---

## ✅ PHASE 6 — Post-Deployment Verification Checklist

Verify the following items on the live site:

| Test Item | Expected Result | Verified |
| :--- | :--- | :---: |
| **Homepage & Hero Slider** | Loads smoothly with responsive high-res banners | [ ] |
| **Category Filtering** | `Mixer Grinder`, `Nutrimix`, `Cookware` tabs filter correctly | [ ] |
| **Product Detail Page** | Displays gallery images, price, included items & specs | [ ] |
| **Dynamic Cart Control** | Button transforms into `[ - ] [ <QTY> IN CART ] [ + ]` | [ ] |
| **Native Checkout** | Opens checkout modal with active payment gateways | [ ] |
| **Order Placement** | Test order appears under **WooCommerce → Orders** in Admin | [ ] |
| **RAG AI Assistant** | Floating chatbot responds to product and price queries | [ ] |

---

## 🛠️ Troubleshooting & Server Settings

* **PHP Limits**: Recommended in `php.ini` or cPanel:
  ```ini
  upload_max_filesize = 256M
  post_max_size = 256M
  memory_limit = 512M
  max_execution_time = 300
  ```
* **REST API 404 Errors**: Go to **Settings → Permalinks** and click **Save Changes**.
