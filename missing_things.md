# Modena WooCommerce Store — Missing Things & Technical Gap Analysis

> **Analysis Date:** August 2026  
> **Target Store:** Modena Home (`https://modenahome.store`)  
> **Hosting Platform:** Hostinger Managed WooCommerce Hosting  
> **Current Stack:** Hybrid React 19 SPA + WooCommerce REST API + FastAPI RAG AI Backend (`rag-backend`)

---

## Executive Summary

This document outlines the pending features, architectural gaps, marketing integrations, and handoff requirements for the **Modena E-Commerce Store** (`https://modenahome.store`).

---

## 📊 Gap Analysis Summary Matrix

| Category | Brief / Production Requirement | Current Status | Missing Action Items | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **Layer A: Editability** | WP Site Editor & `theme.json` Global Tokens | Custom React SPA in `index.php` | `theme.json` token mapping & WP Block Patterns for Site Editor | 🟡 Medium |
| **Layer A: Block Templates** | Native WP Block Templates (`templates/*.html`) | React SPA Handles Routing | Standby fallback block templates for SEO/non-JS fallback | 🟢 Low |
| **Layer B: Meta Integration** | Meta Pixel + Server-side CAPI + Catalog Sync | Frontend simulated pixel | Official `Meta for WooCommerce` plugin & CAPI setup | 🔴 High |
| **Layer B: Google Sync** | Google Merchant Center Feed & Domain Verification | Missing | Official `Google for WooCommerce` plugin & GTIN mapping | 🔴 High |
| **Layer B: SEO & Schema** | Product JSON-LD, XML Sitemap, OpenGraph | Static HTML meta tags | Rank Math / Yoast SEO plugin + Dynamic Product Schema | 🔴 High |
| **Layer B: WhatsApp** | Click-to-chat + Automated Order Updates | Static WhatsApp number link | Floating click-to-chat widget + Cloud API / Interakt Webhooks | 🟡 Medium |
| **Layer B: CRM Sync** | Scoped REST API Keys for CRM/MCP | REST API active in WP | Scoped read/write API key generation & CRM endpoint docs | 🟡 Medium |
| **Performance** | Self-hosted Fonts (No CDN dependency) | Google Fonts CDN imported | Download WOFF2 font files into `/assets/fonts` | 🟢 Low |
| **Compliance** | HSN / GST Tax Split on Invoices | Invoice PDF generated | HSN Code column & CGST/SGST line item breakdown | 🟡 Medium |
| **Handoff Package** | Handoff Doc, Credential Matrix, Test Evidence | `deploy.md` & `README.md` active | Hostinger plugin config, live credential matrix, PageSpeed audit | 🟡 Medium |

---

## 1. WordPress Theme Editability & Block System (Layer A Gaps)

- [ ] **`theme.json` Design Tokens Registration**: Complete color palettes (`#b70100` Modena Red, `#2a1613` Luxury Dark), typography scales, and spacing tokens in `theme.json`.
- [ ] **WordPress Block Patterns**: Register reusable Gutenberg block patterns for Hero Banners, Trust Badges, Category Grids, and FAQs in `functions.php`.
- [ ] **Fallback Block Templates**: Create fallback HTML block templates (`templates/single-product.html`, `templates/archive-product.html`, `templates/page.html`).

---

## 2. External Marketing & Sales Integration Stack (Layer B Gaps)

### A. Meta for WooCommerce (Facebook & Instagram)
- [ ] Install & activate `Meta for WooCommerce` on Hostinger WordPress.
- [ ] Configure Server-Side Conversions API (CAPI) alongside Meta Pixel.
- [ ] Verify automatic catalog synchronization to Meta Business Manager for Instagram Shopping.

### B. Google for WooCommerce (Merchant Center)
- [ ] Install `Google for WooCommerce` (`google-listings-and-ads`).
- [ ] Verify domain ownership of `https://modenahome.store` in Google Search Console / Merchant Center.
- [ ] Map product GTIN / EAN and Brand attributes for Google Shopping ads approval.

### C. SEO, XML Sitemap & Rich Snippet Schema
- [ ] Install and configure `Rank Math SEO` or `Yoast SEO`.
- [ ] Output JSON-LD Product Schema (`@type: Product`, `offers`, `aggregateRating`, `priceCurrency: INR`).
- [ ] Generate dynamic XML sitemaps and verify WhatsApp/Facebook link preview cards.

### D. WhatsApp Business Messaging Stack
- [ ] Add floating click-to-chat WhatsApp button with pre-filled customer query template.
- [ ] Connect WhatsApp Cloud API / BSP (AiSensy / Interakt) for automated order confirmation alerts.

### E. CRM & API Key Management
- [ ] Generate read-scoped WooCommerce REST API keys for CRM synchronization.

---

## 3. Performance & Speed Optimization (Hostinger Environment)

- [ ] **Self-Hosted Web Fonts**: Download `Inter`, `Outfit`, and `Roboto Condensed` WOFF2 fonts into `/assets/fonts` to eliminate Google Fonts CDN calls.
- [ ] **WebP Image Conversion**: Configure Hostinger image optimization to generate WebP variants.
- [ ] **LiteSpeed / Hostinger Cache Exclusions**: Exclude `/wp-json/*`, `/cart`, and `/checkout` from server caching to prevent dynamic state caching issues.

---

## 4. Commerce & Regional Compliance Gaps (India E-Commerce)

- [ ] **GST & HSN Code Support**:
  - Add HSN Code custom field to WooCommerce products (HSN 8509 / HSN 7323).
  - Update `generateInvoicePDF.js` to render HSN column and split taxes into CGST (9%) + SGST (9%) or IGST (18%).
- [ ] **Live Order Tracking Timeline**: Enhance `My Account` order history UI with real-time tracking steps.
- [ ] **Flash Sale Countdown Timer Widget**: Add scarcity countdown component for special offer products.

---

## 5. Security Audit & Hardening Checklist

- [ ] **SQL Injection**: Verify all custom endpoint queries in `functions.php` use `$wpdb->prepare()`.
- [ ] **Cross-Site Scripting (XSS)**: Ensure client inputs are sanitized via `sanitize_text_field()` and React JSX escaping.
- [ ] **CSRF & Nonce Protection**: Verify WordPress REST API nonces and session auth for administrative actions.
- [ ] **SSRF & File Uploads**: Enforce strict domain whitelisting and MIME type checks on media upload handlers.
- [ ] **Authentication & Secrets**: Audit `.env` and `wp-config.php` to prevent API key leaks.

---

## 6. Hostinger Production Readiness Checklist

- [ ] Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `https://modenahome.store` `wp-config.php`.
- [ ] Enable SSL certificate for `modenahome.store` in Hostinger hPanel.
- [ ] Exclude `/wp-json/modena/v1/*` REST API routes from Hostinger LiteSpeed cache.
- [ ] Run production smoke tests on `https://modenahome.store`.
- [ ] Verify Python FastAPI `rag-backend` connection to `https://modenahome.store/api/v1`.

---

## 7. CLIENT ACTION REQUIRED

The core technical code, REST endpoints, GTIN mapping, XML feeds, JSON-LD Schema, dynamic OpenGraph, and CAPI deduplication handlers have been fully implemented in the project. The following final account-level steps require the client/manager:

### 1. Meta Business Manager & Pixel / CAPI Credentials
* **What the client must do:** Retrieve Meta Pixel ID and Conversions API (CAPI) System User Access Token.
* **Where to do it:** Meta Business Manager ➔ Events Manager ➔ Settings ➔ **Conversions API**.
* **What configuration they need:** Add the constants to `wp-config.php`:
  ```php
  define( 'META_PIXEL_ID', 'YOUR_META_PIXEL_ID' );
  define( 'META_CAPI_TOKEN', 'YOUR_META_CAPI_ACCESS_TOKEN' );
  ```
* **How to verify completion:** Run a test checkout on `https://modenahome.store`. Open Meta Events Manager ➔ Test Events. Verify that events (`PageView`, `AddToCart`, `Purchase`) appear with status **"Browser • Server (Deduplicated)"**.

### 2. Meta Product Catalog Sync
* **What the client must do:** Add the automated catalog feed URL to Meta Business Manager.
* **Where to do it:** Meta Commerce Manager ➔ Catalogs ➔ Data Sources ➔ Add Data Feed.
* **What value/configuration they need:** Feed URL:
  `https://modenahome.store/wp-json/modena/v1/facebook-catalog-feed`
* **How to verify completion:** Verify that products load into Meta Commerce Manager for Instagram Shopping.

### 3. Google Merchant Center Feed & Domain Verification
* **What the client must do:** Claim domain ownership and submit the Google Shopping RSS feed.
* **Where to do it:** Google Merchant Center ➔ Settings ➔ Business Information ➔ Website.
* **What value/configuration they need:**
  * Option A: Enter Google HTML verification tag into `wp-config.php`:
    ```php
    define( 'GOOGLE_SITE_VERIFICATION', 'your_google_verification_code' );
    ```
  * Option B: Add Product Feed URL under Google Merchant Center ➔ Feeds:
    `https://modenahome.store/wp-json/modena/v1/google-merchant-feed`
* **How to verify completion:** Check Google Merchant Center Feed Diagnostics tab for zero critical product attribute errors.

### 4. Razorpay Live Production Secret Key
* **What the client must do:** Generate and supply Live Key Secret.
* **Where to do it:** Razorpay Dashboard ➔ Account & Settings ➔ API Keys.
* **What value/configuration they need:** Add to `wp-config.php`:
  ```php
  define( 'RAZORPAY_KEY_SECRET', 'YOUR_RAZORPAY_KEY_SECRET' );
  ```
* **How to verify completion:** Complete a ₹1 live test transaction on `https://modenahome.store`. Verify order moves from *Pending* to *Processing/Completed*.

---

*This document serves as the master checklist for finalizing the Modena E-Commerce Store on Hostinger.*

