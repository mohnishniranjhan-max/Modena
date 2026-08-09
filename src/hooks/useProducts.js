import { useState, useEffect, useCallback } from 'react';

export const IMAGE_MAP = {
  26: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
  31: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
  32: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop',
  33: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
  34: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop'
};

/**
 * Decodes HTML entities (e.g. &#8243; -> ", &#8377; -> ₹) and strips raw HTML tags
 */
export const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#8243;/g, '"')
    .replace(/&#8242;/g, "'")
    .replace(/&#8377;/g, '₹')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>?/gm, '')
    .trim();
};

/**
 * Extracts clean numeric price value from various WooCommerce API structures
 */
export const extractNumericPrice = (item) => {
  if (item.prices?.price) {
    return parseFloat(item.prices.price) / Math.pow(10, item.prices.currency_minor_unit || 2);
  }
  if (typeof item.numericPrice === 'number' && item.numericPrice > 0) {
    return item.numericPrice;
  }
  if (typeof item.price === 'number' && item.price > 0) {
    return item.price;
  }
  if (item.price_html) {
    const text = decodeHtmlEntities(item.price_html);
    const matches = text.match(/[0-9,]+(?:\.[0-9]{2})?/g);
    if (matches && matches.length > 0) {
      const val = parseFloat(matches[matches.length - 1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  if (typeof item.price === 'string') {
    const cleaned = item.price.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (!isNaN(val) && val > 0) return val;
  }
  return 0;
};

export const normalizeProduct = (item) => {
  let img = '';
  if (Array.isArray(item.images) && item.images.length > 0 && item.images[0].src) {
    img = item.images[0].src;
  } else if (item.image) {
    img = item.image;
  } else if (IMAGE_MAP[item.id]) {
    img = IMAGE_MAP[item.id];
  } else {
    img = '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';
  }

  // Override yarn placeholder images
  if (!img || img.includes('1584992236310-6edddc08acff')) {
    img = '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';
  }

  const cleanName = decodeHtmlEntities(item.name || item.title || 'Modena Kitchenware Product');
  const priceVal = extractNumericPrice(item);
  const formattedPrice = `₹${priceVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cleanDesc = decodeHtmlEntities(item.short_description || item.description || item.desc || '');

  let allImages = [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    allImages = item.images.map((i) => (typeof i === 'string' ? i : i.src)).filter(Boolean);
  }
  if (allImages.length === 0 && img) {
    allImages = [img];
  }
  // Provide gallery alternate view angles for rich multi-picture preview experience
  const alternateGalleryViews = [
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop'
  ];
  alternateGalleryViews.forEach((altImg) => {
    if (!allImages.includes(altImg) && allImages.length < 4) {
      allImages.push(altImg);
    }
  });

  return {
    id: item.id,
    name: cleanName,
    title: cleanName,
    price: formattedPrice,
    numericPrice: priceVal,
    price_html: formattedPrice,
    dealPrice: formattedPrice,
    originalPrice: `₹${(priceVal * 1.35).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    image: img,
    images: allImages,
    desc: cleanDesc,
    description: cleanDesc,
    categories: item.categories || [],
    category: decodeHtmlEntities(item.categories?.[0]?.name || item.category || 'General Cookware'),
    stock: item.is_in_stock === false ? 'Out of Stock' : 'In Stock',
    rating: '4.9/5 (500+ Reviews)',
    on_sale: item.on_sale || false
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/wp-json/wc/store/v1/products?per_page=100&timestamp=${new Date().getTime()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data.map(normalizeProduct));
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};
