# Modena React Theme 🎨

A modern, high-performance WordPress Block Theme integrated with a decoupled React frontend and a Python FastAPI backend for RAG (Retrieval-Augmented Generation) capabilities. 

This project bridges the gap between traditional WordPress content management and modern frontend ecosystems, offering dynamic components, automated PDF catalog generation, and AI-powered backend services.

## 🚀 Tech Stack

### Frontend & Theme
- **WordPress** (Block Theme Architecture: `theme.json`, `templates/`, `parts/`)
- **React 19**
- **Vite** (Build Tooling & Fast HMR)
- **Tailwind CSS v4** (Utility-first styling)
- **SWR** (Data fetching & state management)
- **Lucide React** (Iconography)
- **jsPDF & html2canvas** (Client-side PDF generation)

### Backend Services (`/rag-backend`)
- **Python 3**
- **FastAPI** & **Uvicorn**
- *(RAG pipeline dependencies)*

---

## 📂 Project Structure

```text
modena-react-theme/
├── .env.example             # Environment variables template
├── index.php / style.css    # Required WordPress theme files
├── functions.php            # WordPress PHP logic & asset enqueuing
├── theme.json               # WordPress Block Theme configuration
├── templates/               # Block Theme templates
├── parts/                   # Block Theme template parts
├── src/                     # React source code (components, hooks, etc.)
├── public/                  # Static Vite assets
├── assets/                  # Compiled assets (used by WordPress enqueuing)
├── rag-backend/             # Python FastAPI application for RAG
├── _project_extras/         # Documentation, scripts, and deployment guides
└── package.json             # NPM dependencies and scripts
```

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **pnpm**
- **Python 3.10+** (For the FastAPI backend)
- **WordPress Environment** (e.g., LocalWP, Docker, or XAMPP)

---

## 💻 Local Development Setup

### 1. Frontend Setup (React + WordPress)

1. Navigate to the theme directory in your terminal:
   ```bash
   cd wp-content/themes/modena-react-theme
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Note: Vite handles HMR (Hot Module Replacement) for the React components while WordPress serves the shell.*

### 2. Backend Setup (FastAPI RAG Service)

1. Open a new terminal tab and navigate to the backend directory:
   ```bash
   cd wp-content/themes/modena-react-theme/rag-backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

## 📦 Build for Production

When you are ready to deploy, you need to compile the React application into static assets that WordPress can safely load.

```bash
npm run build
```

This command runs `vite build` and automatically moves the compiled JS/CSS files into the `/assets` directory so `functions.php` can enqueue them properly.

---

## 🌐 Deployment

Deploying this multi-tier application (PHP + Node + Python) requires a VPS (Virtual Private Server) for the best results, as shared hosting typically does not support persistent Python processes.

For a comprehensive, step-by-step deployment guide for VPS environments (like Hostinger), please see our dedicated deployment guide:
👉 [**Deployment Guide**](_project_extras/deploy.md)

---

## 📜 License

[MIT License](LICENSE) (or state your proprietary license here)
