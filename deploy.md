# Modena Home — Hostinger Production Deployment & Handover Guide

> **Store URL:** [https://modenahome.store](https://modenahome.store)  
> **Hostinger Admin Panel:** [https://modenahome.store/wp-admin/admin.php?page=hostinger](https://modenahome.store/wp-admin/admin.php?page=hostinger)  
> **Document Version:** 2.0.0 (Hostinger Rebased)  
> **Last Updated:** August 2026  
> **Target Audience:** Engineering Managers, Hostinger Site Administrators, & Handoff Developers  

---

## 1. Project Overview

The **Modena E-Commerce Store** ([https://modenahome.store](https://modenahome.store)) is a hybrid high-performance luxury cookware platform hosted on **Hostinger Managed WooCommerce Hosting**.

### Technical Architecture Overview

* **Storefront UI:** React 19.2 Single Page Application (Vite 8.2, Tailwind CSS v4, Lucide React, SWR, jsPDF).
* **WordPress Theme Directory:** `/public_html/wp-content/themes/modena-react-theme/`
* **E-Commerce Engine:** WordPress 6.x + WooCommerce (REST API v3, custom endpoints in `functions.php`).
* **AI Chatbot Service:** Python 3.10+ FastAPI RAG Backend (`rag-backend/main.py`, ChromaDB vector store, SentenceTransformers).
* **Database:** Hostinger Managed MySQL / MariaDB Database + ChromaDB (Vector database in `rag-backend/chroma_data`).
* **Hosting Provider:** Hostinger Managed WordPress Hosting (LiteSpeed Web Server + Hostinger hPanel).
* **Build Command:** `npm run build` (Builds Vite bundle and syncs into `assets/`).
* **Payment Gateway:** Razorpay API (`/wp-json/modena/v1/create-razorpay-order` & `/verify-razorpay-payment`).

---

## 2. Prerequisites & Hostinger Environment

### Required Software & Versions
* **Hostinger PHP Version:** PHP `8.1` or `8.2` (Configurable via Hostinger hPanel ➔ PHP Configuration).
* **Hostinger Web Server:** LiteSpeed Web Server with `mod_rewrite` & LiteSpeed Cache plugin.
* **Node.js (Build Machine):** `v18.0.0` or higher (`v20.x` recommended).
* **Python (RAG Backend Host):** `3.10` or `3.11`.
* **Database:** Hostinger MySQL `8.0+` / MariaDB `10.5+`.
* **SSL Certificate:** Hostinger Unlimited Free SSL (Let's Encrypt) active on `modenahome.store`.

### Required Accounts & Access
* **Hostinger hPanel:** Access to Hostinger Account / hPanel dashboard for `modenahome.store`.
* **WordPress Admin:** `https://modenahome.store/wp-admin` credentials.
* **Razorpay Merchant Dashboard:** Live Key ID (`rzp_live_...`) and Key Secret.
* **SMTP Service:** Hostinger Business Email / SendGrid / Gmail App Password for order emails.

---

## 3. Project Handover & Build Procedure

### 1. Source Code Repository
Clone the official repository:
```bash
git clone https://github.com/your-org/modena-react-theme.git
cd modena-react-theme
```

### 2. Install & Build Frontend Assets
```bash
# Install frontend dependencies
npm ci

# Build optimized production bundle for Hostinger
npm run build
```
*(This command runs `vite build` and syncs production assets into the `assets/` directory ready for Hostinger deployment).*

---

## 4. Environment Configuration (`modenahome.store`)

### Complete Environment Variable Reference Table

| Variable | Required | Scope | Purpose | Where to Set on Hostinger |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **REQUIRED** | Build | Set to `production` | Local Build / Server `.env` |
| `WP_API_URL` | **REQUIRED** | Frontend | `https://modenahome.store/wp-json` | `.env` file in theme root |
| `RAZORPAY_KEY_ID` | **REQUIRED** | Server | Public Key ID for Razorpay Checkout (`rzp_live_...`) | Hostinger `wp-config.php` |
| `VITE_RAZORPAY_KEY_ID` | **REQUIRED** | Frontend | Public Key ID fallback for React bundle | `.env` file in theme root |
| `RAZORPAY_KEY_SECRET` | **REQUIRED** | Server | Secret Key for server order creation & signature verification | Hostinger `wp-config.php` |
| `RAZORPAY_WEBHOOK_SECRET` | OPTIONAL | Server | Secret string to verify Razorpay webhooks | Hostinger `wp-config.php` |
| `JWT_SECRET` | **REQUIRED** | AI Backend | Secret key for signing RAG session tokens | `rag-backend/.env` |
| `SMTP_SERVER` | OPTIONAL | Server | Hostinger SMTP host (`smtp.hostinger.com`) | `rag-backend/.env` or WP Mail SMTP |
| `SMTP_PORT` | OPTIONAL | Server | Hostinger SMTP port (`465` SSL / `587` TLS) | `rag-backend/.env` or WP Mail SMTP |
| `SMTP_USERNAME` | OPTIONAL | Server | Hostinger transactional email (`orders@modenahome.store`) | `rag-backend/.env` or WP Mail SMTP |
| `SMTP_PASSWORD` | OPTIONAL | Server | Hostinger email password | `rag-backend/.env` or WP Mail SMTP |

### Hostinger `wp-config.php` Credentials Configuration

In Hostinger hPanel File Manager, edit `/public_html/wp-config.php` and add:

```php
// =============================================================================
// MODENA STOREFRONT CONFIGURATION (Hostinger Production)
// =============================================================================
define( 'WP_HOME', 'https://modenahome.store' );
define( 'WP_SITEURL', 'https://modenahome.store' );

// Razorpay Live Payment Credentials
define( 'RAZORPAY_KEY_ID', 'rzp_live_RIB6Het3sxN83R' );
define( 'RAZORPAY_KEY_SECRET', 'YOUR_ACTUAL_RAZORPAY_KEY_SECRET' );

// JWT Authentication Configuration
define( 'JWT_AUTH_SECRET_KEY', 'modena-jwt-secure-key-9f8e7d6c5b4a3210-2026-auth' );
define( 'JWT_AUTH_CORS_ENABLE', true );
```

---

## 5. Hostinger Deployment Architecture

```
                                  +---------------------------------------+
                                  |           VISITOR BROWSER             |
                                  +---------------------------------------+
                                                      |
                                           HTTPS (modenahome.store)
                                                      v
                                  +---------------------------------------+
                                  |      HOSTINGER LITESPEED WEB SERVER   |
                                  |         (Hostinger hPanel / SSL)      |
                                  +---------------------------------------+
                                     /                                 \
           WordPress & REST API     /                                   \ AI RAG Proxy
                                   v                                     v
+--------------------------------------------------+   +--------------------------------------------------+
|           HOSTINGER WORDPRESS ENGINE             |   |            FASTAPI RAG AI BACKEND                |
|  (/public_html/wp-content/themes/modena-react)   |   |        (Hostinger VPS / Render / Railway)        |
+--------------------------------------------------+   +--------------------------------------------------+
          |                                                       |
          v                                                       v
+--------------------------------------------------+   +--------------------------------------------------+
|          HOSTINGER MYSQL DATABASE                |   |            CHROMADB VECTOR STORE                 |
|     (Products, Orders, Customers, Meta)          |   |         (Product Catalog Embeddings)           |
+--------------------------------------------------+   +--------------------------------------------------+
```

---

## 6. Hostinger Deployment Steps (Step-by-Step)

### Step 1 — Build Local Frontend Bundle
On your development machine:
```bash
npm run build
```

### Step 2 — Upload Theme to Hostinger
1. Log into Hostinger hPanel for **[modenahome.store](https://modenahome.store/wp-admin/admin.php?page=hostinger)**.
2. Open **File Manager** ➔ Navigate to `/public_html/wp-content/themes/modena-react-theme/`.
3. Upload all project files (`index.php`, `functions.php`, `style.css`, `theme.json`, `index.html`, `dist/`, `assets/`, `src/`, `package.json`).
*(Alternatively, deploy via Hostinger Git Deployment integration under hPanel ➔ Advanced ➔ Git).*

### Step 3 — Configure Hostinger `wp-config.php`
Edit `/public_html/wp-config.php` via Hostinger File Manager to insert:
* `RAZORPAY_KEY_ID`
* `RAZORPAY_KEY_SECRET`
* `JWT_AUTH_SECRET_KEY`

### Step 4 — Activate Theme in WordPress Admin
1. Go to `https://modenahome.store/wp-admin`.
2. Navigate to **Appearance ➔ Themes**.
3. Activate **Modena React Theme**.

### Step 5 — Configure Hostinger LiteSpeed Cache Exclusions
1. In WordPress Admin, open **LiteSpeed Cache ➔ Cache ➔ Exclude**.
2. Add the following URIs to **Do Not Cache URIs**:
   * `/wp-json/modena/v1/*`
   * `/wp-json/wc/v3/*`
   * `/cart`
   * `/checkout`
3. Click **Save Changes**. *(This prevents caching issues with Razorpay payments and live stock updates).*

### Step 6 — Deploy FastAPI RAG Backend (`rag-backend`)
For the Python AI Chatbot assistant:
* **Option A (Hostinger VPS / Python Runner):** Run `rag-backend/main.py` using `uvicorn main:app --host 0.0.0.0 --port 8000`.
* **Option B (Managed Cloud Runner - Render/Railway):** Connect `rag-backend` repository to Render/Railway and set `JWT_SECRET` environment variable. Add rewrite rule in Hostinger `.htaccess` to forward `/api/v1/*` to your FastAPI server instance.

### Step 7 — Enable Hostinger SSL & HTTPS Enforcement
1. In Hostinger hPanel ➔ **Security ➔ SSL**, verify SSL is **Active** for `modenahome.store`.
2. Toggle **Force HTTPS** to ON.

### Step 8 — Configure Razorpay Live Webhooks
1. Open **Razorpay Dashboard ➔ Settings ➔ Webhooks**.
2. Add Webhook URL: `https://modenahome.store/wp-json/modena/v1/verify-razorpay-payment`.
3. Select Events: `order.paid`, `payment.captured`, `payment.failed`.

---

## 7. Domain & SSL Verification (`modenahome.store`)

* **Primary Domain:** `https://modenahome.store`
* **Hostinger Admin Management:** `https://modenahome.store/wp-admin/admin.php?page=hostinger`
* **SSL Certificate:** Free Let's Encrypt / Hostinger SSL active.
* **HTTP to HTTPS Redirect:** Automatic 301 Redirect enforced via Hostinger `.htaccess`:
  ```apache
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```

---

## 8. Hostinger Production Security Checklist

- [x] **HTTPS Active:** TLS 1.3 encryption active on `https://modenahome.store`.
- [x] **Hostinger Firewall (WAF):** Hostinger ModSecurity WAF enabled in hPanel.
- [x] **Secrets Protection:** `RAZORPAY_KEY_SECRET` stored securely in `wp-config.php`, out of root file tree.
- [x] **Cache Exclusions:** REST API `/wp-json/` routes excluded from LiteSpeed caching.
- [x] **PHP Security:** PHP `WP_DEBUG_DISPLAY` set to `false`.

---

## 9. Testing & Acceptance Checklist (`modenahome.store`)

- [ ] Homepage `https://modenahome.store` loads cleanly without console errors
- [ ] Product details and mobile Amazon-style product cards render properly
- [ ] Cart adding, removing, and quantity adjustments function seamlessly
- [ ] Checkout page loads customer address fields
- [ ] Razorpay Checkout modal opens with valid live order ID (`order_...`)
- [ ] Test purchase completes and updates order status in `https://modenahome.store/wp-admin`
- [ ] PDF Invoice generation works via client browser
- [ ] RAG AI Chatbot assistant answers product questions correctly

---

## 10. Troubleshooting Hostinger Deployment

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **Razorpay Returns 400 Bad Request** | Missing `RAZORPAY_KEY_SECRET` in `wp-config.php` | Add `define('RAZORPAY_KEY_SECRET', '...')` in `/public_html/wp-config.php` |
| **Rest API Returns Stale Cart/Stock Data** | LiteSpeed Caching REST endpoints | Exclude `/wp-json/*` in **LiteSpeed Cache ➔ Cache ➔ Exclude URIs** |
| **404 Page Not Found on Permalinks** | Hostinger `.htaccess` rewrite rules missing | Go to `wp-admin` ➔ **Settings ➔ Permalinks** and click **Save Changes** |
| **FastAPI Chatbot Proxy Error** | `rag-backend` process down | Restart `uvicorn` process or check cloud deployment logs |

---

## 11. MANAGER MUST PROVIDE (Hostinger Pre-Flight)

1. **Hostinger Account Access:** hPanel login or Hostinger Delegated Access for `modenahome.store`.
2. **Razorpay Live Secret Key:** `RAZORPAY_KEY_SECRET` from Razorpay Dashboard.
3. **Hostinger Email / SMTP Passwords:** Password for `orders@modenahome.store` (if using Hostinger Email).

---

*End of Hostinger Deployment Guide.*
