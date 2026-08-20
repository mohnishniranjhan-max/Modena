# Modena E-Commerce Project Handover Documentation

---

## 3. EXECUTIVE OVERVIEW

**What this website is:**  
This is a modern e-commerce platform for "Modena Kitchenware" that sells premium kitchen appliances, cookware, and utensils.

**What the website is used for:**  
It allows customers to browse products, read detailed specifications, compare items, add them to a cart, and securely check out. It also features a built-in AI assistant to answer customer queries in real-time.

**Who uses it:**  
- **Customers:** Everyday consumers and culinary professionals purchasing kitchenware.
- **Store Managers/Administrators:** Internal staff who add/edit products, manage orders, and analyze AI chatbot performance.

**What business problem it solves:**  
It provides a lightning-fast, app-like shopping experience while keeping the robust inventory management of a traditional CMS (WordPress/WooCommerce), paired with an advanced AI chatbot to reduce customer support overhead.

**Main technologies:**  
- **Frontend:** React 19 (compiled by Vite) styled with Tailwind CSS.
- **Backend CMS:** WordPress (with WooCommerce) acting as a headless data source.
- **AI Backend:** Python FastAPI server handling the intelligent Chatbot.

**Overall architecture:**  
The frontend lives inside a custom WordPress theme folder. When a user visits the site, WordPress loads the React application. React then communicates with WordPress for product data and payments, and with the Python FastAPI backend for AI chatbot interactions. 

---

## 4. TECHNOLOGY STACK

| Technology | Purpose | Location | Why it is used |
| ---------- | ------- | -------- | -------------- |
| **React 19** | Frontend Framework | `/src/` | Builds the interactive, single-page application (SPA) shopping experience. |
| **Vite** | Build Tool | `vite.config.js` | Compiles the React code extremely fast into static assets for WordPress to load. |
| **Tailwind CSS v4** | Styling | `package.json` | Allows rapid, utility-first UI styling directly in the components. |
| **WordPress** | CMS Shell | Root directory | Serves as the administrative backend for product and order management. |
| **WooCommerce** | E-commerce Engine | WP Plugin (Assumed) | Manages products, stock, and orders. Exposed via REST API. |
| **Python 3** | AI Backend | `/rag-backend/` | Runs the RAG (Retrieval-Augmented Generation) pipeline for the chatbot. |
| **FastAPI** | Python API Framework | `/rag-backend/main.py` | Exposes fast, asynchronous endpoints for the chatbot and webhooks. |
| **ChromaDB** | Vector Database | `/rag-backend/chroma_data/`| Stores product embeddings so the AI can search and retrieve product knowledge. |
| **Razorpay** | Payment Gateway | `RazorpayCheckout.jsx` | Processes credit cards, UPI, and net banking securely in India. |
| **MySQL / MariaDB** | Primary Database | WP Environment | Stores standard WordPress/WooCommerce data (users, products, orders). |

---

## 5. SYSTEM ARCHITECTURE

**Data Flow:**

1. **Customer** opens the website in their browser.
2. **WordPress (Web Server)** serves the compiled React application (HTML/JS/CSS).
3. **React Frontend** loads and immediately requests product data.
4. **React** → calls → **WordPress REST API** (to get products, categories, recipes).
5. **Customer** asks the AI Chatbot a question.
6. **React** → calls → **FastAPI Backend (`/api/v1/chat/assistant`)**.
7. **FastAPI** → queries → **ChromaDB** for product knowledge.
8. **Customer** checks out.
9. **React** → calls → **WordPress Razorpay Endpoint** to create a secure order.
10. **Razorpay** securely processes the payment and verifies it with WordPress.

**Identification:**
- **Frontend:** React Single Page Application.
- **Backend / CMS:** WordPress + WooCommerce.
- **AI Microservice:** Python FastAPI + ChromaDB.
- **Payment Gateway:** Razorpay.
- **Hosting:** Hostinger VPS (Documented via `deploy.md`).

---

## 6. PROJECT FOLDER STRUCTURE

```text
wp-content/themes/modena-react-theme/
├── .env.example             # Template for required environment variables.
├── build_pdf.py             # Utility script for generating PDF catalogs.
├── deploy.md                # Documentation for Hostinger VPS deployment.
├── functions.php            # WordPress core file. Registers custom REST APIs and enqueues React assets.
├── index.php                # WordPress fallback file. Should NOT be modified.
├── package.json             # Node.js dependencies and build scripts.
├── theme.json               # WordPress Block Theme configuration (colors, fonts).
├── templates/               # WordPress block templates (page, single-product).
├── parts/                   # WordPress template parts (header, footer).
├── src/                     # REACT FRONTEND SOURCE CODE
│   ├── App.jsx              # Main React application entry point & router.
│   ├── components/          # Reusable UI components (Checkout, Chatbot, etc.).
│   ├── hooks/               # Custom React hooks (useProducts, useRecipes).
│   ├── pages/               # Top-level page views (Home, Philosophy, etc.).
│   └── utils/               # Helper functions (analytics, PDF generation).
├── public/                  # Static assets copied directly to build output.
└── rag-backend/             # PYTHON AI BACKEND
    ├── main.py              # FastAPI server entry point.
    ├── chroma_data/         # Local ChromaDB vector storage. Do not modify manually.
    ├── ingester.py          # Script that syncs WP products into ChromaDB.
    ├── rag_chain.py         # AI logic for answering customer questions.
    └── requirements.txt     # Python dependencies.
```

---

## 7. WEBSITE PAGES

| Page | Route | Purpose | Data Source | Main Files |
| ---- | ----- | ------- | ----------- | ---------- |
| **Home** | `/` or `#home` | Landing page, banners, flash deals, and bestsellers. | WordPress API | `src/pages/Home.jsx`, `src/App.jsx` |
| **Product Detail** | `#product/:id` | Displays detailed info, images, and reviews for a single product. | WordPress API | `src/App.jsx` (Inline view) |
| **Recipes List** | `#recipes` | Culinary content and guides. | WordPress API | `src/pages/RecipesList.jsx` |
| **Recipe Detail** | `#recipe/:slug` | Specific cooking instructions. | WordPress API | `src/pages/RecipeDetail.jsx` |
| **Philosophy** | `#philosophy` | Brand story and about us page. | Static | `src/pages/Philosophy.jsx` |
| **Corporate Gifting**| `#corporate-gifting` | B2B lead generation page. | Static | `src/pages/CorporateGifting.jsx`|
| **Search Results** | `#searchResults` | Display queried products. | WordPress API | `src/App.jsx` |

---

## 8. COMPONENT DOCUMENTATION

- **`RazorpayCheckout.jsx`**
  - **Location:** `src/components/Checkout/`
  - **Purpose:** Handles the secure payment flow.
  - **Props:** `amount`, `customerName`, `customerEmail`, `customerPhone`, `onPaymentSuccess`.
  - **Warning:** Do not modify the backend REST API verification flow without fully understanding Razorpay signature verification.
- **`Chatbot.jsx`**
  - **Location:** `src/components/Chatbot/`
  - **Purpose:** Floating AI assistant for customer queries.
  - **Data Source:** `rag-backend/main.py`.
- **`ProductList.jsx`**
  - **Location:** `src/components/Products/`
  - **Purpose:** Renders grids of products (used on Homepage and Search Results).
- **`StorePolicies.jsx`**
  - **Location:** `src/components/Legal/`
  - **Purpose:** Displays static shipping, return, and warranty policies.

---

## 9. PRODUCT SYSTEM

**How it works:**
1. **Creation:** Managers log into the standard WordPress Admin Dashboard and create a product in WooCommerce.
2. **Storage:** The product is saved in the MySQL database.
3. **AI Sync:** A webhook automatically sends the product data to the Python `/api/v1/webhook/woocommerce/product-update` endpoint, which embeds the text and saves it to ChromaDB so the AI Chatbot knows about it.
4. **Frontend Display:** The React app's `useProducts()` hook fetches the product catalogue via the WooCommerce REST API and displays it in the `ProductList` component.

**Features Supported:** Categories, Pricing, Stock Status, Images, Related Products.  
**Out-of-Stock Behavior:** Products categorized as "out-of-stock" are dynamically excluded from certain grids by the frontend logic.

---

## 10. WORDPRESS / CMS DOCUMENTATION

**Purpose:** Acts as a headless CMS and eCommerce engine.
- **Product Management:** Handled entirely via WooCommerce.
- **Custom Code:** 
  - `functions.php` registers custom REST API endpoints (`/wp-json/modena/v1/create-razorpay-order`).
  - `theme.json` defines global colors and typography for the Block Theme shell.

| Plugin | Purpose | Important settings | Can it be disabled? |
| ------ | ------- | ------------------ | ------------------- |
| **WooCommerce** | E-commerce engine | Must have REST API enabled. | **NO. Critical.** |
| **Razorpay for WooCommerce** | Payment gateway | API Keys. | **NO. Critical.** |

---

## 11. ADMIN WORKFLOW

**How to Manage the Website (For Managers):**

1. **Add/Edit a Product:** 
   - Log into `yoursite.com/wp-admin`.
   - Go to **Products → Add New**.
   - Enter Title, Description, Price, and Image. Publish.
   - *Note: The AI Chatbot will automatically learn about this new product.*
2. **Handle Out of Stock:**
   - In WooCommerce, change the inventory status to "Out of Stock". The React frontend will automatically update.
3. **Manage Banners/Homepage Content:**
   - Currently, Hero banners (`banner1.png`, etc.) are hardcoded in the React frontend (`src/assets/hero/`). To change them, a developer must replace the images and run a new build.

---

## 12. API DOCUMENTATION

| Endpoint | Method | Purpose | Authentication |
| -------- | ------ | ------- | -------------- |
| `/wp-json/modena/v1/create-razorpay-order` | `POST` | Generates a secure Razorpay order ID for checkout. | Open (Relies on WooCommerce integration) |
| `/wp-json/modena/v1/verify-razorpay-payment`| `POST` | Validates payment signature after checkout. | Open |
| `/api/v1/chat/assistant` | `POST` | RAG Chatbot query processing. | Rate Limited |
| `/api/v1/webhook/woocommerce/product-update`| `POST` | Syncs WP product to Vector DB. | Internal/Webhook |
| `/api/v1/admin/rag-eval` | `GET` | Returns analytics on Chatbot performance. | Open/Admin |

---

## 13. DATABASE DOCUMENTATION

**1. Relational Database (MySQL):**
- Standard WordPress/WooCommerce schema.
- **Purpose:** Stores users, orders, product inventory, and site settings.

**2. Vector Database (ChromaDB):**
- Located in `/rag-backend/chroma_data/`.
- **Purpose:** Stores mathematical embeddings of product descriptions.
- **Data Flow:** WP Webhook → FastAPI Ingester → ChromaDB.

*Backup Approach:* MySQL should be backed up daily via a standard WP backup plugin (e.g., UpdraftPlus). The `chroma_data` folder should be backed up at the server level, but can be fully regenerated by re-syncing WP products.

---

## 14. ENVIRONMENT VARIABLES & SECRETS

| Variable | Purpose | Required? | Where configured |
| -------- | ------- | --------- | ---------------- |
| `NODE_ENV` | React mode | Yes | `.env` |
| `WP_API_URL` | Connects React to WP | Yes | `.env` |
| `WP_USERNAME` | WP REST API access | Yes | `.env` |
| `WP_APPLICATION_PASSWORD`| WP REST API access | Yes | `.env` |
| `WC_CONSUMER_KEY` | WooCommerce API | Yes | `.env` |
| `WC_CONSUMER_SECRET`| WooCommerce API | Yes | `.env` |
| `RAZORPAY_KEY_ID` | Payment gateway | Yes | `.env` |
| `RAZORPAY_KEY_SECRET` | Payment gateway | Yes | `.env` |
| `JWT_SECRET` | Auth Token generation | Yes | `.env` |

**Security Warning:** These variables are highly sensitive. NEVER commit `.env` to Git. Only `.env.example` is tracked.

---

## 15. INSTALLATION / LOCAL DEVELOPMENT

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- LocalWP or Docker for WordPress

### Frontend Setup
1. Navigate to theme: `cd wp-content/themes/modena-react-theme`
2. Install Node modules: `npm install`
3. Copy env template: `cp .env.example .env`
4. Start dev server: `npm run dev`

### Backend Setup (AI)
1. Navigate to backend: `cd rag-backend`
2. Create virtual env: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run server: `python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`

---

## 16. PRODUCTION DEPLOYMENT

This stack requires a **VPS (Virtual Private Server)** (e.g., Hostinger VPS).
- **WordPress:** Served normally via Nginx + PHP-FPM.
- **React:** Built statically via `npm run build`. The `dist/assets` are copied to `assets/` and enqueued by WordPress.
- **FastAPI:** Runs as a persistent Linux `systemd` background service (Gunicorn/Uvicorn).
- **Nginx:** Acts as a reverse proxy, routing `/api/` traffic to the Python service (port 8000) and all other traffic to WordPress/React.

*(For exact server commands, refer to `_project_extras/deploy.md`).*

---

## 17. DOMAIN & DNS

`Not confirmed from project files` (Assumed standard A-record pointing to the VPS IP address).

---

## 18. PAYMENT SYSTEM

**Gateway:** Razorpay

**Flow:**
1. User clicks "Pay securely".
2. React calls WP API (`create-razorpay-order`) with the cart total.
3. WP requests an Order ID securely from Razorpay's servers.
4. Razorpay checkout modal opens in the browser.
5. User completes payment.
6. React calls WP API (`verify-razorpay-payment`) with the payment signature.
7. WP verifies the signature using the hidden `RAZORPAY_KEY_SECRET`.
8. Order is marked as completed.

---

## 19. THIRD-PARTY INTEGRATIONS

| Service | Purpose | Connection Method | Configuration Location |
| ------- | ------- | ----------------- | ---------------------- |
| **Razorpay** | Processing Payments | REST API & SDK | `RazorpayCheckout.jsx` & `functions.php` |
| **WhatsApp** | Customer Support | Deep Link (`wa.me`) | `src/utils/whatsapp.js` |
| **Meta Pixel** | Ad Tracking | Client JS | `src/utils/analytics.js` |
| **Amazon** | Authentication | OAuth (Pending) | `AmazonAuthModal.jsx` |

---

## 20. SEO

- Handled primarily by WordPress. 
- React routing utilizes URL Hashes (`#product/mixer`) or deep links. 
- Schema and meta tags: `Not explicitly confirmed in React source`; presumed managed by WP plugins (e.g., Yoast) injected into the `<head>`.

---

## 21. ANALYTICS & TRACKING

- **Tool:** Meta Pixel & Conversion API (CAPI).
- **Location:** `src/utils/analytics.js`
- **What is tracked:** Purchases. Triggered automatically upon successful Razorpay signature verification.

---

## 22. SECURITY

- **CORS:** FastAPI backend strictly allows traffic only from localhost and `modena.local`.
- **Payload Limits:** FastAPI rejects payloads > 2MB to prevent DDOS (`MaxBodySizeMiddleware`).
- **Rate Limiting:** FastAPI implements `RateLimitMiddleware` to prevent API abuse.
- **Payments:** Razorpay secrets are kept exclusively on the server (`functions.php` / `.env`). The client only sees the public `KEY_ID`.

---

## 23. BACKUP & RECOVERY

`BACKUP SYSTEM NOT CONFIRMED / NOT IMPLEMENTED` natively in the codebase.
*Recommendation:* Install a WordPress backup plugin for MySQL/PHP files. Configure daily automated VPS snapshots via the hosting provider.

---

## 24. TROUBLESHOOTING GUIDE

### Chatbot is unresponsive or returning 500 errors
- **Cause:** The Python FastAPI backend is down.
- **Solution:** SSH into the server and run `sudo systemctl restart fastapi` (or check logs via `journalctl -u fastapi`).

### Payments are failing immediately
- **Cause:** Missing or incorrect Razorpay API keys in the `.env` file.
- **Solution:** Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the production environment.

### New products aren't showing up on the frontend
- **Cause:** React relies on WooCommerce REST API.
- **Solution:** Ensure the product is published, visible, and has a price. Check browser network tab for `/wp-json/wc/` errors.

---

## 25. COMMON MAINTENANCE TASKS

- **Manager Tasks (Safe):** Adding products, updating prices, fulfilling orders in WP Admin, responding to WhatsApp queries.
- **Developer Tasks (Requires Code Changes):** Changing homepage banner images, modifying the store's color scheme, updating React dependencies, restarting the Python AI service.

---

## 26. DO NOT MODIFY THESE FILES

- **`rag-backend/chroma_data/`**: This is a binary vector database. Modifying it manually will corrupt the AI's knowledge base.
- **`package-lock.json`**: Ensures dependency version consistency.
- **`index.php`**: Required by WordPress block themes to function as a fallback. Modifying it breaks the theme.

---

## 27. IMPORTANT FILES MAP

| File/Folder | Purpose | Who should modify it? |
| ----------- | ------- | --------------------- |
| `src/App.jsx` | Main React application and routing logic. | Developer |
| `rag-backend/main.py` | Python AI API Server. | Developer |
| `functions.php` | WP Backend logic and API integrations. | Developer |
| `theme.json` | Global typography, colors, and layout widths. | Developer / Designer |

---

## 28. ERROR LOGS & DEBUGGING

- **Frontend Errors:** Viewable in the Browser Developer Tools (Console tab).
- **WordPress Errors:** Enable `WP_DEBUG` in `wp-config.php` to output `debug.log`.
- **Python Backend Errors:** Viewable via `journalctl -u fastapi -f` on the production server.

---

## 29. DEVELOPMENT WORKFLOW

1. **Development:** Run `npm run dev` and edit files in `src/`.
2. **Commit:** Push changes to GitHub.
3. **Build:** Run `npm run build`. This generates the static assets in `dist/` and copies them to `assets/`.
4. **Deploy:** Pull changes to the VPS, ensure `assets/` is updated, and restart Python if backend code changed.

---

## 30. CURRENT PROJECT STATUS

- **Completed:** React SPA frontend, WooCommerce API integration, Razorpay Checkout, Python FastAPI RAG integration.
- **Warnings:** Amazon Auth (`AmazonAuthModal.jsx`) appears partially implemented.
- **Technical Debt:** Homepage banners are hardcoded inside the React `src` folder instead of being fetched from the CMS.

---

## 31. MANAGER QUICK START

## "If You Only Read One Section"
1. **What this is:** A fast e-commerce site connected to WordPress for inventory and a custom AI chatbot for customer service.
2. **Where to manage products:** Log into your standard WordPress Admin dashboard. The website will update automatically.
3. **What not to touch:** Do not edit the `.env` files or touch the server terminal unless you are a developer.
4. **If payments break:** Check your Razorpay keys in the `.env` file.
5. **If the AI stops working:** Ask your developer to restart the Python backend service.

---

## 32. DEVELOPER QUICK REFERENCE

- **Frontend:** React + Vite + Tailwind 4
- **Backend:** WordPress REST API + Python FastAPI
- **Local WP URL:** `http://modena.local`
- **Start React:** `npm run dev`
- **Start AI:** `cd rag-backend && source venv/bin/activate && python -m uvicorn main:app --reload`
- **Build App:** `npm run build`

---

## 33. CREDENTIALS & ACCESS MANAGEMENT

The following credentials are required to operate this project fully:
- **Hostinger VPS SSH Login:** `[REQUIRED — obtain from project owner]`
- **WordPress Admin Login:** `[REQUIRED — obtain from project owner]`
- **Razorpay Production API Keys:** `[REQUIRED — obtain from project owner]`
- **OpenAI API Key (for RAG Backend):** `[REQUIRED — obtain from project owner]`

---

## 34. FINAL PROJECT MAP

```text
[ Customer ]
     │
     ▼
[ React SPA Frontend ] ── (Payment) ──▶ [ Razorpay ]
     │           │
(Products)   (AI Chat)
     │           │
     ▼           ▼
[ WordPress ]  [ Python FastAPI ]
     │           │
     ▼           ▼
[ MySQL ]      [ ChromaDB ]
```
