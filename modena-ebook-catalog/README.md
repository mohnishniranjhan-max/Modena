# Modena Dynamic E-Book Catalog

A completely independent, vanilla HTML/CSS/JS module that generates a premium digital brochure and PDF-ready catalog by fetching product data directly from the existing Modena (WooCommerce) database.

## Features
- **Dynamic Integration**: No hardcoded products. Pulls live data from `/wp-json/wc/store/v1/products`.
- **Vanilla Tech Stack**: Zero build tools, no React, pure HTML/CSS/JS. Easy to drop into any folder.
- **Auto-Generated Layouts**: Dynamically builds category divider pages and 2x2 A4 product grids.
- **Native PDF Export**: Leverages advanced `@page` CSS and `window.print()` to generate high-resolution, selectable text PDFs without relying on heavy external canvas libraries like `html2pdf`.
- **Branding Compliant**: Uses existing Modena tokens (`--color-primary: #C91F26`, Jost/Inter fonts).

## Folder Structure
```
/modena-ebook-catalog
├── index.html           # Main SPA entry point
├── assets/
│   ├── css/
│   │   ├── styles.css   # Global variables and resets
│   │   ├── ebook.css    # Layouts for A4 pages and grids
│   │   └── print.css    # Strict media queries for PDF generation
│   ├── js/
│   │   ├── app.js       # Orchestrator
│   │   ├── products.js  # API Fetching and Data Normalization
│   │   ├── catalog.js   # DOM Generation (Categories & Products)
│   │   └── pdf-export.js# Print API binding
├── pages/               # HTML Partials
│   ├── cover.html
│   ├── about.html
│   ├── toc.html
│   └── contact.html
```

## How to use
1. Host this folder alongside your existing WordPress theme.
2. Navigate to `.../modena-ebook-catalog/index.html` in your browser.
3. The catalog will auto-build itself from the database.
4. Click **Export to PDF** (top right) and choose **"Save as PDF"** in the print dialog. (Ensure "Background graphics" is enabled if required by the browser to see the red divider pages).
