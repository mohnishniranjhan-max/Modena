import { useCallback, useEffect } from 'react';
import useSWR from 'swr';

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

export const getStoredReviews = () => {
  try {
    const data = localStorage.getItem('modena_reviews_db');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveReviewToDb = (reviewObj) => {
  try {
    const existing = getStoredReviews();
    const updated = [reviewObj, ...existing];
    localStorage.setItem('modena_reviews_db', JSON.stringify(updated));
    window.dispatchEvent(new Event('modena_reviews_updated'));
    return updated;
  } catch {
    return [];
  }
};

export const getProductReviews = (productId) => {
  const allReviews = getStoredReviews();
  const productReviews = allReviews.filter(
    (r) => String(r.product_id) === String(productId) || String(r.productId) === String(productId)
  );
  // Sort highest rated reviews first
  return productReviews.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
};

export const getProductRatingData = (item) => {
  if (!item) {
    return {
      averageRating: 0,
      ratingCount: 0,
      hasReviews: false,
      ratingText: 'No reviews',
      displayRating: 'No reviews',
      ratingBadge: 'No reviews'
    };
  }

  const dbReviews = getProductReviews(item.id);
  const dbCount = dbReviews.length;

  let totalRatingSum = 0;
  let totalCount = 0;

  if (dbCount > 0) {
    totalCount = dbCount;
    totalRatingSum = dbReviews.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0);
  } else {
    // Check WooCommerce API fields safely
    const rawAvg = item.average_rating !== undefined ? item.average_rating : item.rating;
    const rawCount = item.rating_count !== undefined ? item.rating_count : item.review_count;
    
    const apiAvg = parseFloat(rawAvg);
    const apiCount = parseInt(rawCount, 10);
    
    if (!isNaN(apiAvg) && apiAvg > 0 && !isNaN(apiCount) && apiCount > 0) {
      totalRatingSum = apiAvg * apiCount;
      totalCount = apiCount;
    }
  }

  if (totalCount === 0 || totalRatingSum === 0 || isNaN(totalRatingSum) || isNaN(totalCount)) {
    return {
      averageRating: 0,
      ratingCount: 0,
      hasReviews: false,
      ratingText: 'No reviews',
      displayRating: 'No reviews',
      ratingBadge: 'No reviews'
    };
  }

  const avg = parseFloat((totalRatingSum / totalCount).toFixed(1));
  if (isNaN(avg) || avg <= 0) {
    return {
      averageRating: 0,
      ratingCount: 0,
      hasReviews: false,
      ratingText: 'No reviews',
      displayRating: 'No reviews',
      ratingBadge: 'No reviews'
    };
  }

  return {
    averageRating: avg,
    ratingCount: totalCount,
    hasReviews: true,
    ratingText: `${avg.toFixed(1)} (${totalCount} ${totalCount === 1 ? 'Review' : 'Reviews'})`,
    displayRating: `★ ${avg.toFixed(1)} (${totalCount})`,
    ratingBadge: `★★★★★ ${avg.toFixed(1)} (${totalCount} ${totalCount === 1 ? 'Review' : 'Reviews'})`
  };
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
  const isOnSale = item.on_sale || false;

  let currentPriceVal = priceVal;
  let regPriceVal = priceVal;

  if (item.prices) {
    if (item.prices.regular_price) {
      const parsedReg = parseFloat(item.prices.regular_price) / Math.pow(10, item.prices.currency_minor_unit || 2);
      if (!isNaN(parsedReg) && parsedReg > 0) regPriceVal = parsedReg;
    }
    if (isOnSale && item.prices.sale_price) {
      const parsedSale = parseFloat(item.prices.sale_price) / Math.pow(10, item.prices.currency_minor_unit || 2);
      if (!isNaN(parsedSale) && parsedSale > 0) currentPriceVal = parsedSale;
    }
  }

  const formattedPrice = `₹${currentPriceVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedRegPrice = `₹${(regPriceVal > currentPriceVal ? regPriceVal : currentPriceVal * 1.35).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cleanDesc = decodeHtmlEntities(item.short_description || item.description || item.desc || '');

  let allImages = [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    allImages = item.images.map((i) => (typeof i === 'string' ? i : i.src)).filter(Boolean);
  }
  if (allImages.length === 0 && img) {
    allImages = [img];
  }

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

  let itemCategories = Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : [];
  if (itemCategories.length === 0) {
    const nameLower = (cleanName || '').toLowerCase();
    const isElec =
      nameLower.includes('mixer') ||
      nameLower.includes('blender') ||
      nameLower.includes('750w') ||
      nameLower.includes('550w') ||
      nameLower.includes('990w') ||
      nameLower.includes('sindoor') ||
      nameLower.includes('sujata') ||
      nameLower.includes('karina') ||
      nameLower.includes('preethi') ||
      nameLower.includes('nutri');
    if (isElec) {
      itemCategories = [
        { id: 106, name: 'Electronics', slug: 'electronics' },
        { id: 107, name: 'Mixer Grinders', slug: 'mixer-grinders' },
        { id: 100, name: 'Bestseller', slug: 'bestseller' },
        { id: 103, name: 'Deal', slug: 'deal' }
      ];
    } else {
      itemCategories = [
        { id: 111, name: 'Utensils', slug: 'utensils' },
        { id: 113, name: 'Tri-Ply Stainless Steel', slug: 'stainless-steel' },
        { id: 100, name: 'Bestseller', slug: 'bestseller' },
        { id: 103, name: 'Deal', slug: 'deal' }
      ];
    }
  }

  const primaryCategory = itemCategories[0]?.name || 'General Cookware';
  const ratingData = getProductRatingData(item);

  const isOutOfStockCategory = itemCategories.some(
    (c) =>
      c.slug === 'out-of-stock' ||
      (c.name || '').toLowerCase() === 'out of stock' ||
      (c.name || '').toLowerCase() === 'out-of-stock'
  );

  const isOutOfStock =
    isOutOfStockCategory ||
    item.is_in_stock === false ||
    item.stock_status === 'outofstock' ||
    item.stock === 'Out of Stock';

  return {
    id: item.id,
    name: cleanName,
    title: cleanName,
    price: formattedPrice,
    numericPrice: currentPriceVal,
    price_html: formattedPrice,
    dealPrice: formattedPrice,
    originalPrice: isOnSale ? formattedRegPrice : null,
    image: img,
    images: allImages,
    desc: cleanDesc,
    description: cleanDesc,
    categories: itemCategories,
    category: primaryCategory,
    stock: isOutOfStock ? 'Out of Stock' : 'In Stock',
    is_in_stock: !isOutOfStock,
    isOutOfStock: isOutOfStock,
    average_rating: ratingData.averageRating,
    rating_count: ratingData.ratingCount,
    review_count: ratingData.ratingCount,
    hasReviews: ratingData.hasReviews,
    ratingText: ratingData.ratingText,
    displayRating: ratingData.displayRating,
    ratingBadge: ratingData.ratingBadge,
    rating: ratingData.displayRating,
    on_sale: isOnSale
  };
};

/**
 * Calculates a logarithmic Bayesian-style weighted rating score based on average rating and review volume.
 * Formula: Score = Rating * (1 + log10(ReviewCount + 1))
 * Example 1: 1000 reviews @ 4.6 stars -> 4.6 * (1 + 3.00) = 18.40 (Rank 1)
 * Example 2: 30 reviews @ 5.0 stars  -> 5.0 * (1 + 1.49) = 12.45 (Rank 2)
 */
export const calculateWeightedRatingScore = (item) => {
  if (!item) return 0;
  const data = getProductRatingData(item);
  if (!data.hasReviews || data.averageRating <= 0 || data.ratingCount <= 0) {
    return 0;
  }
  const rating = data.averageRating;
  const count = data.ratingCount;
  return parseFloat((rating * (1 + Math.log10(count + 1))).toFixed(4));
};

export const sortProductsByRating = (productsList) => {
  if (!Array.isArray(productsList)) return [];
  return [...productsList].sort((a, b) => {
    const scoreA = calculateWeightedRatingScore(a);
    const scoreB = calculateWeightedRatingScore(b);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    if (b.on_sale !== a.on_sale) {
      return (b.on_sale ? 1 : 0) - (a.on_sale ? 1 : 0);
    }
    return 0;
  });
};

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch products');
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('Invalid JSON response');
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const normalized = data.map(normalizeProduct);
  return sortProductsByRating(normalized);
};

export const useProducts = () => {
  const { data, error, isLoading, mutate } = useSWR(
    '/wp-json/wc/store/v1/products?per_page=100',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true
    }
  );

  useEffect(() => {
    const handleUpdate = () => {
      mutate();
    };
    window.addEventListener('modena_reviews_updated', handleUpdate);
    return () => window.removeEventListener('modena_reviews_updated', handleUpdate);
  }, [mutate]);

  const sortedData = data ? sortProductsByRating(data) : [];

  return {
    products: sortedData,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: mutate
  };
};
