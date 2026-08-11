# Modena WooCommerce Store — Missing Things & Technical Gap Analysis

> **Analysis Date:** August 9, 2026  
> **Target Brief:** WooCommerce Block Theme & Integration Stack (7-Day Developer Brief)  
> **Current Stack:** Hybrid React 19 SPA + WooCommerce REST API + FastAPI RAG AI Backend (`rag-backend`)

---

## Executive Summary

This document outlines all missing features, architectural gaps, unconfigured integrations, and handoff requirements for the **Modena E-Commerce Store**. 

While the project features a **state-of-the-art React 19 Single Page Application (SPA)** with interactive Amazon-style mobile cards, live search, invoice PDF generation, Zoho Pay checkout, and a custom RAG AI Chatbot backend, there are several key items specified in the **Developer Task Brief** and standard e-commerce production checklists that remain to be implemented or configured.

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
| **Handoff Package** | Handoff Doc, Credential Matrix, Test Evidence | `Project_Documentation.md` exists | Plugin config sheet, credential ownership matrix, PageSpeed audit | 🟡 Medium |

---

## 1. WordPress Theme Editability & Block System (Layer A Gaps)

The Developer Task Brief emphasizes a **Fully Editable Block Theme** where non-developers can customize colors, fonts, and homepage sections via the WordPress Site Editor without editing code.

- [ ] **`theme.json` Design Tokens Registration**:
  - `theme.json` should contain complete color palettes (`#b70100` Modena Red, `#2a1613` Luxury Dark), typography scales, and spacing tokens so WP Site Editor can control global styles.
- [ ] **WordPress Block Patterns**:
  - Register reusable block patterns for Hero Banners, Trust Badges, Category Grids, and FAQ sections in `functions.php` so non-tech admins can insert/edit them via the Gutenberg editor.
- [ ] **Fallback Block Templates**:
  - Create standard fallback HTML block templates (`templates/single-product.html`, `templates/archive-product.html`, `templates/page.html`) for search engines or non-JS environments.

---

## 2. External Marketing & Sales Integration Stack (Layer B Gaps)

Per Section 2 of the Developer Brief, external services must sit cleanly on top of WooCommerce via official plugins rather than hardcoded theme scripts.

### A. Meta for WooCommerce (Facebook & Instagram)
- [ ] **Official Plugin Installation**: Install & activate `Meta for WooCommerce`.
- [ ] **Server-Side Conversions API (CAPI)**: Configure CAPI alongside browser Pixel to prevent data loss from ad-blockers and browser privacy restrictions.
- [ ] **Auto Catalog Synchronization**: Verify sync of product titles, prices, stock, and 4:3 images to Meta Business Manager for Instagram Shopping.

### B. Google for WooCommerce (Merchant Center)
- [ ] **Official Plugin Installation**: Install `Google for WooCommerce` (`google-listings-and-ads`).
- [ ] **Domain Ownership Verification**: Verify site URL in Google Search Console / Merchant Center.
- [ ] **GTIN / EAN & Brand Attributes**: Map product SKU or GTIN fields to feed attributes so products are approved for Google Shopping ads without disapproval.

### C. SEO, XML Sitemap & Rich Snippet Schema
- [ ] **SEO Plugin Configuration**: Install `Rank Math SEO` or `Yoast SEO`.
- [ ] **Product Schema (JSON-LD)**: Output structured data (`@type: Product`, `offers`, `aggregateRating`, `priceCurrency: INR`) on product pages for Google Rich Search results.
- [ ] **XML Sitemap & OpenGraph Preview**: Generate dynamic XML sitemaps for products & categories; verify WhatsApp and Facebook link preview cards.

### D. WhatsApp Business Messaging Stack
- [ ] **Floating Click-to-Chat Button**: Lightweight frontend WhatsApp widget pre-filled with customer queries (e.g. *"Hi Modena Support, I need help with order #..."*).
- [ ] **Automated Order Update Webhooks**: Connect WhatsApp Cloud API / BSP (AiSensy, Interakt, or Boei) for automated order confirmation and dispatch alerts.

### E. CRM & API Key Management
- [ ] **Scoped REST API Keys**: Generate read-scoped WooCommerce REST API keys for CRM synchronization (e.g., HubSpot / Custom CRM / MCP).
- [ ] **Security Protocol**: Ensure admin API keys are strictly stored in server environment variables, never exposed in git repositories.

---

## 3. Performance & Speed Optimization

- [ ] **Self-Hosted Web Fonts**: Download `Inter` and `Outfit` WOFF2 fonts into `public/fonts/` to eliminate external Google Fonts CDN network calls (improves FCP & INP scores).
- [ ] **WebP Image Conversion**: Ensure all WooCommerce product uploads automatically generate WebP variants.
- [ ] **Cache Rules & PageSpeed Audit**:
  - Exclude `/wp-json/wc/v3/*` REST endpoints and `/cart` / `/checkout` from server caching.
  - Run Google PageSpeed Insights (mobile target > 85+ Core Web Vitals score).

---

## 4. Commerce & Regional Compliance Gaps (India E-Commerce)

- [ ] **GST & HSN Code Support**:
  - Add HSN Code field to products (e.g., HSN 8509 for Mixer Grinders, HSN 7323 for Cast Iron Cookware).
  - Update `src/utils/generateInvoicePDF.js` to render HSN column and split taxes into **CGST (9%) + SGST (9%)** or **IGST (18%)**.
- [ ] **Live Order Tracking Timeline**:
  - Enhance `My Account` order history UI with real-time status steps (`Order Placed` ➔ `Processing` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`).
- [ ] **Flash Sale Countdown Timer Widget**:
  - Add optional scarcity countdown timer component for special deal products.

---

## 5. Deliverables & Handoff Package Checklist

Per Section 7 of the Developer Task Brief, the final handoff must include:

- [ ] **Plugin & Config Sheet**: Matrix of all installed plugins, purpose, and settings.
- [ ] **Credential Ownership Matrix**: Secure document listing account owners for Meta, Google, Zoho Pay, and WhatsApp Business.
- [ ] **Test Evidence Package**:
  - Screenshot of successful Zoho Pay test order.
  - Meta Pixel / CAPI event verification screenshot.
  - Google Merchant Center feed approval screenshot.
- [ ] **FastAPI RAG Backend Deployment Guide**: Instructions for running `rag-backend/main.py` in production (Uvicorn / Systemd / Docker).

---

*This document serves as the master checklist for finalizing the Modena E-Commerce Store for staging sign-off and production launch.*
