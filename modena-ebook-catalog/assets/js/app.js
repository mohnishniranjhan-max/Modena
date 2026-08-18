import { fetchProducts } from './products.js';
import { renderCatalog } from './catalog.js';
import { setupPdfExport } from './pdf-export.js';

const loadPartial = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        return await response.text();
    } catch (error) {
        console.error(error);
        return '';
    }
};

const initApp = async () => {
    const container = document.getElementById('catalog-container');
    const loadingOverlay = document.getElementById('loading-overlay');

    // 1. Load static HTML partials
    const [coverHTML, aboutHTML, tocHTML, contactHTML] = await Promise.all([
        loadPartial('pages/cover.html'),
        loadPartial('pages/about.html'),
        loadPartial('pages/toc.html'),
        loadPartial('pages/contact.html')
    ]);

    // Inject initial pages
    container.innerHTML = `
        ${coverHTML}
        ${aboutHTML}
        ${tocHTML}
        ${contactHTML}
    `;

    // 2. Fetch Dynamic Product Data
    const categorizedProducts = await fetchProducts();

    // 3. Render Catalog (Injects dynamically before contact page)
    renderCatalog(categorizedProducts);

    // 4. Hide loading overlay
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 300);
    }

    // 5. Setup PDF Export Hook
    setupPdfExport();

    document.getElementById('btn-toc').addEventListener('click', () => {
        const tocPage = document.querySelector('.toc-page');
        if (tocPage) {
            tocPage.scrollIntoView({ behavior: 'smooth' });
        }
    });
};

document.addEventListener('DOMContentLoaded', initApp);
