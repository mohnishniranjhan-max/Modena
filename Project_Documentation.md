# Modena Home - E-Commerce Platform Documentation

## 1. Project Overview
Modena is a premium, high-performance headless e-commerce web application tailored for luxury kitchenware and heavy-duty home appliances. Built on modern React and integrated with WooCommerce, the platform is designed to provide an "Apple-like" seamless shopping experience. It features fluid, responsive designs, a fully integrated AI sales representative, and a highly optimized checkout flow.

## 2. Technology Stack
The platform utilizes a cutting-edge headless architecture, decoupling the frontend presentation layer from the backend commerce engine.

### Frontend (Client-Side)
* **Framework:** React 18 (Bootstrapped with Vite for instant server start and lightning-fast HMR).
* **Styling:** Tailwind CSS v4 (Leveraging native `@container` queries and fluid typography via `clamp()`).
* **Icons:** Lucide React (Lightweight, consistent SVG icons).
* **State Management:** React Hooks (`useState`, `useEffect`, custom hooks) with `localStorage` for cart and session persistence.
* **Payment Gateway:** Razorpay (Integrated directly into the React checkout modal).
* **PDF Generation:** Custom invoice generation for order receipts.

### Backend (Server-Side & APIs)
* **Commerce Engine:** WooCommerce (WordPress) acting as a Headless CMS and Order Management System (OMS).
* **Database:** MySQL (InnoDB optimized with High-Performance Order Storage - HPOS enabled).
* **AI & NLP Services:** Python FastAPI backend (`rag-backend`) integrated with Google's Gemini 1.5 Flash API for the intelligent Chatbot.
* **Performance:** Redis Object Caching enabled in `wp-config.php` for lightning-fast database query resolution.

## 3. Key Features
1. **Intelligent AI Sales Representative ("Alex"):** 
   - Powered by Gemini, the chatbot acts as a virtual showroom assistant.
   - **Context-Aware:** Knows exactly which product the user is currently viewing.
   - **RAG Capabilities:** Searches the live WooCommerce catalog to recommend products natively within the chat UI.
2. **"Antigravity" Responsive Design:** 
   - Utilizes physics-based container queries (`.physics-container`) to ensure UI components (like the product grid) fluidly adapt to their parent container's width, completely eliminating brittle window-size breakpoints.
3. **Headless WooCommerce Integration:** 
   - Products are fetched dynamically from the live database.
   - Inventory, pricing, and orders sync in real-time.
4. **Frictionless Checkout Flow:** 
   - Single-page pop-up modal checkout.
   - Integrated Razorpay for UPI, NetBanking, and Card payments.
   - Automated form population for logged-in users.
5. **Comprehensive User Accounts:** 
   - Customers can track active packages via BlueDart, initiate return requests, and one-click reorder past purchases.
6. **Premium UI/UX Micro-Interactions:** 
   - Sticky glassmorphism navbars with smooth border-radius interpolation.
   - Interactive hero carousels with dynamic color themes.
   - Snappy drawer animations for the Cart and Mobile menus.

## 4. How to Explain the Project (Pitch / Presentation Guide)

When presenting this project to stakeholders, interviewers, or clients, structure your explanation into three pillars: **Design**, **Intelligence**, and **Performance**.

* **The Hook:** "Modena isn't just a website; it's a digital showroom. We built a headless e-commerce platform that brings the premium feel of an Apple Store to kitchenware."
* **Highlight the Architecture:** "We separated the frontend from the backend. By using React and Vite on the front, we achieve instant page loads and app-like transitions. We kept WooCommerce on the backend solely as a robust database and order manager."
* **Showcase the AI:** "Instead of a dumb FAQ bot, we integrated a Gemini-powered Sales Representative named Alex. If a customer is looking at a Mixer Grinder, Alex knows they are looking at it, and can instantly answer technical questions about motor RPMs or pitch complementary accessories."
* **Emphasize the UI:** "We moved away from rigid screen breakpoints and implemented CSS Container Queries. This means our product cards resize perfectly whether they are in a full-screen grid or squeezed into a tiny mobile cart drawer."

## 5. System Architecture Flow
1. **User visits site** -> React (Vite) serves the SPA.
2. **Product Load** -> Custom React hook (`useProducts`) fetches JSON data from the WooCommerce REST API.
3. **User asks a question** -> Chatbot sends payload to Gemini API (or the local Python FastAPI `rag-backend`) to process the natural language query against the product catalog.
4. **User buys product** -> React opens Razorpay modal -> Payment success token is generated -> Order payload is pushed directly into WooCommerce HPOS tables.
