/**
 * Data fetching module
 */

// Helper to decode HTML entities
const decodeHtmlEntities = (str) => {
    if (!str || typeof str !== 'string') return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    let decoded = textarea.value;
    // Strip tags
    decoded = decoded.replace(/<[^>]*>?/gm, '').trim();
    return decoded;
};

// Extractor for clean price
const extractNumericPrice = (item) => {
    if (item.prices?.price) {
        return parseFloat(item.prices.price) / Math.pow(10, item.prices.currency_minor_unit || 2);
    }
    return 0;
};

// Normalize raw WooCommerce product data
const normalizeProduct = (item) => {
    let img = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop';
    if (Array.isArray(item.images) && item.images.length > 0 && item.images[0].src) {
        img = item.images[0].src;
    }

    const cleanName = decodeHtmlEntities(item.name || 'Modena Kitchenware Product');
    const cleanDesc = decodeHtmlEntities(item.short_description || item.description || '');
    
    const priceVal = extractNumericPrice(item);
    const formattedPrice = `₹${priceVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let itemCategories = Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : [];
    const primaryCategory = itemCategories[0]?.name || 'General Cookware';

    // Simple attributes parsing if needed for specs
    const specs = item.attributes ? item.attributes.map(attr => `${attr.name}: ${attr.terms.map(t => t.name).join(', ')}`) : [];

    return {
        id: item.id,
        name: cleanName,
        price: priceVal > 0 ? formattedPrice : 'Price on Request',
        image: img,
        description: cleanDesc,
        category: primaryCategory,
        specs: specs
    };
};

export const fetchProducts = async () => {
    try {
        // Automatically route API requests through the Vite Dev Server (5173) if viewed via VS Code Live Server (5500)
        // This prevents 404s and CORS errors when testing the catalog standalone.
        const baseUrl = (window.location.port === '5500' || window.location.hostname === '127.0.0.1') 
            ? 'http://localhost:5173' 
            : '';

        // Fetch from WordPress REST API (same as the React theme)
        const response = await fetch(`${baseUrl}/wp-json/wc/store/v1/products?per_page=100`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        
        // Normalize
        const products = data.map(normalizeProduct);
        
        // Group by category
        const categorized = {};
        products.forEach(p => {
            if (!categorized[p.category]) {
                categorized[p.category] = [];
            }
            categorized[p.category].push(p);
        });
        
        return categorized;
    } catch (error) {
        console.error('Error fetching products:', error);
        return {};
    }
};
