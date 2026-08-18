import React, { useState, useEffect, useMemo } from 'react';
import { Check, Star, Plus, RefreshCw, AlertCircle, Heart, Zap, Truck, ShieldCheck, Tag, Sparkles, Flame, CookingPot, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { normalizeProduct, decodeHtmlEntities, getProductRatingData, sortProductsByRating, calculateWeightedRatingScore } from '../../hooks/useProducts';
import AccessoriesSection from './AccessoriesSection';
import CartQuantityControl from '../Common/CartQuantityControl';

const CONSUMER_KEY = 'ck_44ce4325fc8396012c1fb6bc4a9318e3b5c7fff0';

const ProductList = ({ onAddToCart, onUpdateQuantity, cart = [], onSelectProduct, searchQuery = '', selectedCategory = null, selectedCategoryName = null, wishlist = [], onToggleWishlist }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState([]);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('rating_desc');
  const [priceFilter, setPriceFilter] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const isMixerCategory = ['mixer', 'mixer-grinder', 'mixer-grinders'].includes((selectedCategoryName || '').toLowerCase().trim());

  const accessoryProducts = useMemo(() => {
    if (!isMixerCategory || !products || products.length === 0) return [];
    return products.filter((p) => {
      const pCats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase());
      return pCats.includes('accessories');
    });
  }, [isMixerCategory, products]);

  // Reset activeSubCategoryId whenever page view/category changes
  useEffect(() => {
    setActiveSubCategoryId(null);
  }, [selectedCategoryName]);

  const fetchWordPressCategories = async () => {
    try {
      const [catRes, hierRes] = await Promise.all([
        fetch(`/wp-json/wc/store/v1/products/categories?per_page=100&timestamp=${new Date().getTime()}`),
        fetch(`/wp-json/modena/v1/category-hierarchy?timestamp=${new Date().getTime()}`)
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const cleaned = data.map((c) => ({
            ...c,
            name: decodeHtmlEntities(c.name)
          }));
          setCategories(cleaned);
        }
      }

      if (hierRes.ok) {
        const hierData = await hierRes.json();
        if (Array.isArray(hierData)) {
          setCategoryHierarchy(hierData);
        }
      }
    } catch {
      // Silently handle fetch failure
    }
  };

  const fetchWordPressProducts = async (catId = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/wp-json/wc/store/v1/products?per_page=100&timestamp=${new Date().getTime()}`;
      if (catId) {
        url += `&category=${catId}`;
      }
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized = data.map((item) => normalizeProduct(item));
          setProducts(normalized);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordPressCategories();
    fetchWordPressProducts(selectedCategory);
  }, [selectedCategory]);

  // Compute Parent Category, Subcategories & Filtered Category Products Dynamically
  const { currentParentCategory, displayCategories, categoryFilteredProducts } = React.useMemo(() => {
    if (!selectedCategoryName || selectedCategoryName === 'home' || selectedCategoryName === 'all' || selectedCategoryName === 'products') {
      const mainCats = categories.filter((c) => !c.parent || c.parent === 0 || c.parent_id === 0)
        .filter(c => {
          const cSlug = (c.slug || '').toLowerCase();
          const cName = (c.name || '').toLowerCase();
          return !cSlug.includes('corporate') && !cName.includes('corporate');
        });
        
      const globalProducts = products.filter(p => {
        const pCats = (p.categories || []).map(c => ((c.name || '') + ' ' + (c.slug || '')).toLowerCase());
        return !pCats.some(c => c.includes('corporate'));
      });

      return {
        currentParentCategory: null,
        displayCategories: mainCats.length > 0 ? mainCats : categories.filter(c => !(c.slug || '').toLowerCase().includes('corporate')),
        categoryFilteredProducts: globalProducts
      };
    }

    const targetName = selectedCategoryName.toLowerCase().trim();

    // Find parent category matching the section name
    const parentCat = categories.find((c) => {
      const cName = (c.name || '').toLowerCase();
      const cSlug = (c.slug || '').toLowerCase();
      return cName === targetName || cSlug === targetName || cName.includes(targetName) || targetName.includes(cName);
    });

    const parentId = parentCat ? parentCat.id : null;

    // Filter products that belong to this section or any of its subcategories
    const matchingProducts = products.filter((p) => {
      if (targetName === 'bestseller' || targetName === 'bestsellers' || targetName === 'recipes') {
        return true;
      }
      const pCats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase());
      const isAccessory = pCats.includes('accessories');
      if (targetName === 'mixer' || targetName === 'mixer-grinder' || targetName === 'mixer-grinders') {
        const isMixer = pCats.includes('mixer-grinder') || pCats.includes('mixer') || (p.name || '').toLowerCase().includes('mixer grinder');
        return isMixer && !isAccessory;
      }
      return pCats.some((c) => c === targetName || (p.categories || []).some(cat => (cat.slug || '').toLowerCase() === targetName || (cat.name || '').toLowerCase() === targetName));
    });

    // Subcategories MUST strictly belong to this parent category
    const subCatMap = new Map();

    categories.forEach((c) => {
      const pId = typeof c.parent === 'object' ? c.parent?.id : (c.parent || c.parent_id);
      const cNameLower = (c.name || '').toLowerCase().trim();
      const cSlugLower = (c.slug || '').toLowerCase().trim();
      
      // Strict check: category parent ID matches parentId, OR parent name matches section
      const belongsToParent =
        (parentId && pId === parentId) ||
        (parentId && c.parent_name && c.parent_name.toLowerCase().includes(targetName));

      if (belongsToParent && cNameLower !== targetName) {
        // Calculate exact count of matching products in this section for this subcategory
        const actualCount = matchingProducts.filter((p) => {
          const pCat = (p.category || '').toLowerCase();
          const pCats = (p.categories || []).map((catItem) => ((catItem.name || '') + ' ' + (catItem.slug || '')).toLowerCase()).join(' ');
          return pCat.includes(cNameLower) || pCats.includes(cNameLower) || pCats.includes(cSlugLower);
        }).length;

        subCatMap.set(c.id, {
          id: c.id,
          name: decodeHtmlEntities(c.name),
          count: actualCount > 0 ? actualCount : c.count
        });
      }
    });

    // Fallback: If WooCommerce categories have parent === 0 for subcategories, match against product category tags that do NOT belong to other main sections
    if (subCatMap.size === 0 && parentCat) {
      const otherMainSectionNames = ['utensils', 'electronics', 'bestseller', 'deal', 'hero', 'home', 'cookware'];
      const excludedNames = otherMainSectionNames.filter((n) => n !== targetName);

      matchingProducts.forEach((p) => {
        if (Array.isArray(p.categories)) {
          p.categories.forEach((c) => {
            const cName = decodeHtmlEntities(c.name || '');
            const cNameLower = cName.toLowerCase().trim();
            const isExcluded = excludedNames.some((ex) => cNameLower.includes(ex));
            if (cNameLower !== targetName && c.id !== parentCat.id && !isExcluded) {
              if (!subCatMap.has(c.id)) {
                subCatMap.set(c.id || cName, {
                  id: c.id || cName,
                  name: cName,
                  count: categories.find((cat) => cat.id === c.id)?.count || 1
                });
              }
            }
          });
        }
      });
    }

    return {
      currentParentCategory: parentCat,
      displayCategories: Array.from(subCatMap.values()),
      categoryFilteredProducts: matchingProducts
    };
  }, [categories, products, selectedCategoryName]);

  // Final Filter & Sort Products: Subcategory + Search Query
  const displayProducts = React.useMemo(() => {
    let list = [...categoryFilteredProducts];

    // If subcategory pill is clicked, filter by subcategory
    if (activeSubCategoryId) {
      const subCat = categories.find((c) => c.id === activeSubCategoryId);
      if (subCat) {
        const subName = subCat.name.toLowerCase().trim();
        const subSlug = (subCat.slug || '').toLowerCase().trim();
        list = list.filter((p) => {
          const pCat = (p.category || '').toLowerCase();
          const pCats = (p.categories || []).map((c) => ((c.name || '') + ' ' + (c.slug || '')).toLowerCase()).join(' ');
          return pCat.includes(subName) || pCats.includes(subName) || pCats.includes(subSlug);
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.categories || []).map((c) => (c.name || '').toLowerCase()).join(' ');
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // Filter by Price Range
    if (priceFilter === 'under_2000') {
      list = list.filter((p) => (p.numericPrice || 0) < 2000);
    } else if (priceFilter === '2000_5000') {
      list = list.filter((p) => (p.numericPrice || 0) >= 2000 && (p.numericPrice || 0) <= 5000);
    } else if (priceFilter === 'above_5000') {
      list = list.filter((p) => (p.numericPrice || 0) > 5000);
    }

    // Filter by In-Stock Only
    if (inStockOnly) {
      list = list.filter((p) => p.stock !== 'Out of Stock');
    }

    // Sorting (Weighted Rating Algorithm by default: Rating * (1 + log10(ReviewCount + 1)))
    list.sort((a, b) => {
      const priceA = a.numericPrice || 0;
      const priceB = b.numericPrice || 0;

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');

      // Default / rating_desc: Weighted score formula combining rating + review volume
      const scoreA = calculateWeightedRatingScore(a);
      const scoreB = calculateWeightedRatingScore(b);

      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.on_sale ? 1 : 0) - (a.on_sale ? 1 : 0);
    });

    return list;
  }, [categoryFilteredProducts, activeSubCategoryId, categories, searchQuery, priceFilter, inStockOnly, sortBy]);

  const handleAddToCart = async (product) => {
    setAddingId(product.id);
    try {
      const addEndpoints = [
        '/wp-json/wc/store/cart/add-item'
      ];

      let apiCartData = null;
      for (const endpoint of addEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: product.id, quantity: 1 })
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            apiCartData = await res.json();
            break;
          }
        } catch {
          // ignore
        }
      }

      if (onAddToCart) {
        onAddToCart(product, apiCartData);
      }
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch {
      if (onAddToCart) {
        onAddToCart(product, null);
      }
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    } finally {
      setAddingId(null);
    }
  };

  // Structured Price Renderer
  const renderProductPrice = (product) => {
    if (product.prices) {
      const symbol = product.prices.currency_symbol || '₹';
      const minorUnit = product.prices.currency_minor_unit ?? 2;
      const formatAmount = (valStr) => {
        if (!valStr) return '0';
        const num = parseFloat(valStr) / Math.pow(10, minorUnit);
        return num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
      };

      const currentPrice = formatAmount(product.prices.price);
      const regularPrice = formatAmount(product.prices.regular_price);
      const isOnSale =
        product.on_sale ||
        (product.prices.regular_price && product.prices.price !== product.prices.regular_price);

      if (isOnSale && regularPrice !== currentPrice) {
        return (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="font-headline-md text-xl text-[#2A2724] font-bold">
              {symbol}{currentPrice}
            </span>
            <span className="text-xs text-[#8A827C] line-through font-body-md">
              {symbol}{regularPrice}
            </span>
          </div>
        );
      }

      return (
        <span className="font-headline-md text-xl text-[#2A2724] font-bold">
          {symbol}{currentPrice}
        </span>
      );
    }

    if (product.price_html) {
      return (
        <div
          className="font-headline-md text-base text-[#2A2724] font-medium leading-snug [&_.screen-reader-text]:hidden [&_ins]:no-underline [&_ins]:font-bold [&_del]:text-xs [&_del]:text-[#8A827C] [&_del]:mr-1"
          dangerouslySetInnerHTML={{ __html: product.price_html }}
        />
      );
    }

    return (
      <span className="font-headline-md text-xl text-[#2A2724] font-bold">
        ₹{product.price || 0}
      </span>
    );
  };

  // 1. DYNAMIC SUBCATEGORY SECTIONS (Max 2 subcategories rendered on main category view)
  const dynamicSubcategorySections = useMemo(() => {
    if (!currentParentCategory || !displayCategories || displayCategories.length === 0) return [];
    if (activeSubCategoryId) return [];

    // Max 2 subcategories
    const validSubcategories = displayCategories.slice(0, 2);

    return validSubcategories
      .map((subCat) => {
        const subName = (subCat.name || '').toLowerCase().trim();
        const subProducts = categoryFilteredProducts.filter((p) => {
          const pCat = (p.category || '').toLowerCase();
          const pCats = (p.categories || []).map((c) => ((c.name || '') + ' ' + (c.slug || '')).toLowerCase()).join(' ');
          return pCat.includes(subName) || pCats.includes(subName);
        });
        return {
          id: subCat.id,
          name: subCat.name,
          parentName: currentParentCategory.name,
          products: subProducts
        };
      })
      .filter((section) => section.products.length > 0);
  }, [currentParentCategory, displayCategories, activeSubCategoryId, categoryFilteredProducts]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#E60000] border-t-transparent"></div>
        <p className="mt-4 font-headline-md text-lg text-[#514C48]">
          Loading Modena Collection...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
        <div className="bg-[#FAF8F6] border border-[#E2DCD7] p-8 rounded-lg inline-block max-w-md">
          <AlertCircle className="w-10 h-10 text-[#E60000] mx-auto mb-3" />
          <h3 className="font-headline-md text-lg text-[#2A2724] font-medium mb-2">Store Catalog Notice</h3>
          <p className="font-body-md text-xs text-[#514C48] mb-6">{error}</p>
          <button
            onClick={fetchWordPressProducts}
            className="bg-[#E60000] hover:bg-[#E60000] text-white px-5 py-2.5 rounded font-label-caps text-xs flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> RETRY SYNC
          </button>
        </div>
      </div>
    );
  }

  const getCategoryHeaderData = (catName) => {
    const name = (catName || 'all').toLowerCase().trim();
    if (name === 'mixer-grinder' || name === 'mixer' || name === 'mixer-grinders' || name === 'mixer grinders') {
      return {
        eyebrow: 'MIXER GRINDERS',
        title: 'SHOP MIXER GRINDERS',
        description: 'Powerful mixer grinders made for easy daily grinding.'
      };
    }
    if (name === 'nutrimix') {
      return {
        eyebrow: 'NUTRIMIX',
        title: 'SHOP NUTRIMIX',
        description: 'Fast blenders for healthy smoothies and quick meal prep.'
      };
    }
    if (name === 'cookware' || name === 'kitchenware' || name === 'utensils') {
      return {
        eyebrow: 'COOKWARE',
        title: 'SHOP COOKWARE',
        description: 'Cast iron pans, tri-ply stainless steel kadais, pots, and food-grade chopping boards made for everyday cooking.'
      };
    }
    if (name === 'electronics') {
      return {
        eyebrow: 'APPLIANCES',
        title: 'KITCHEN APPLIANCES',
        description: 'Electric mixers, induction stoves, and kitchen appliances.'
      };
    }
    if (name === 'bestseller' || name === 'bestsellers') {
      return {
        eyebrow: 'POPULAR CHOICE',
        title: 'OUR BESTSELLERS',
        description: 'Our most popular kitchen products loved by customers.'
      };
    }
    if (name === 'deal' || name === 'deals') {
      return {
        eyebrow: 'SPECIAL OFFERS',
        title: 'DEALS & DISCOUNTS',
        description: 'Discounts and sale prices across our kitchen collection.'
      };
    }
    if (name === 'searchResults') {
      return {
        eyebrow: 'SEARCH RESULTS',
        title: 'SEARCH PRODUCTS',
        description: 'Matching products found in our store.'
      };
    }
    return {
      eyebrow: 'OUR COLLECTION',
      title: 'SHOP ALL PRODUCTS',
      description: 'Strong kitchen products made for everyday use.'
    };
  };

  const renderProductCard = (product) => {
    const rawImg = product.image || product.images?.[0]?.src || product.images?.[0]?.thumbnail;
    const imageSrc = (!rawImg || rawImg.includes('1584992236310-6edddc08acff'))
      ? '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'
      : rawImg;
    const imageAlt = product.images?.[0]?.alt || product.name;
    const isAdding = addingId === product.id;
    const isAdded = addedId === product.id;

    const isWishlisted = wishlist.some((p) => p.id === product.id);
    const isOut =
      product.isOutOfStock ||
      product.stock === 'Out of Stock' ||
      product.is_in_stock === false ||
      (product.categories || []).some(
        (c) => c.slug === 'out-of-stock' || (c.name || '').toLowerCase() === 'out of stock'
      );

    const parsedAvg = parseFloat(product.average_rating || product.rating);
    const parsedCount = parseInt(product.rating_count || product.review_count, 10);
    const hasRealReviews = !isNaN(parsedAvg) && parsedAvg > 0 && !isNaN(parsedCount) && parsedCount > 0;

    return (
      <div
        key={product.id}
        className={`bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 duration-300 transition-all group relative overflow-hidden ${
          isOut ? 'opacity-75 grayscale-[25%]' : ''
        }`}
      >
        <div>
          {/* Badge & Wishlist */}
          <div className="relative mb-3">
            {isOut && (
              <span className="absolute top-2 left-2 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider bg-stone-800">
                OUT OF STOCK
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist && onToggleWishlist(product);
              }}
              className="absolute top-2 right-2 z-10 w-8.5 h-8.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isWishlisted ? 'fill-[#C91F26] text-[#C91F26]' : 'text-gray-400 hover:text-[#C91F26]'
                }`}
              />
            </button>
            <div
              onClick={() => onSelectProduct && onSelectProduct(product)}
              className="w-full aspect-[4/3] bg-[#FAF8F6]/60 rounded-xl overflow-hidden flex items-center justify-center p-3 cursor-pointer border border-[#FAF8F6] relative"
            >
              {isOut && <div className="absolute inset-0 bg-stone-900/10 pointer-events-none rounded-xl" />}
              {imageSrc && imageSrc.trim() !== '' ? (
                <img
                  src={imageSrc}
                  alt={imageAlt || product.name || 'Product Image'}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg"
                />
              ) : null}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2 text-xs">
            {hasRealReviews ? (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-[#2A2724]">
                  {parsedAvg.toFixed(1)} ({parsedCount})
                </span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                No reviews
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h3
            onClick={() => onSelectProduct && onSelectProduct(product)}
            className="font-bold text-base text-[#2A2724] truncate mb-1 cursor-pointer hover:text-[#C91F26] transition-colors leading-snug"
          >
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {product.short_description || product.description || 'Modena culinary product engineered for high performance and longevity.'}
          </p>
        </div>

        {/* Footer Price & Add to Cart */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto gap-3">
          <div className="flex flex-col min-w-0">
            {renderProductPrice(product)}
          </div>

          <CartQuantityControl
            product={product}
            cart={cart}
            onAddToCart={onAddToCart || handleAddToCart}
            onUpdateQuantity={onUpdateQuantity}
            buttonText="Add to Cart"
          />
        </div>
      </div>
    );
  };

  const headerData = getCategoryHeaderData(selectedCategoryName);

  return (
    <section id="products-section" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-[#D8D4CD] pb-6">
        <div>
          <h1 className="font-headline-md text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#292725] tracking-tight uppercase">
            {headerData.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#716D67] max-w-md font-medium leading-relaxed">
          {headerData.description}
        </p>
      </div>

      {/* 2. CATEGORY TABS (if applicable) */}
      {displayCategories && displayCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={() => setActiveSubCategoryId(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
              activeSubCategoryId === null
                ? 'bg-[#C91F26] text-white border-[#C91F26]'
                : 'bg-[#F8F7F4] text-[#292725] hover:bg-[#EAE7E1] border-[#D8D4CD]'
            }`}
          >
            {selectedCategoryName && selectedCategoryName !== 'home' && selectedCategoryName !== 'all'
              ? `ALL ${selectedCategoryName.toUpperCase()} (${categoryFilteredProducts.length})`
              : `ALL PRODUCTS (${categoryFilteredProducts.length})`}
          </button>

          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveSubCategoryId(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                activeSubCategoryId === cat.id
                  ? 'bg-[#C91F26] text-white border-[#C91F26]'
                  : 'bg-[#F8F7F4] text-[#292725] hover:bg-[#EAE7E1] border-[#D8D4CD]'
              }`}
            >
              {decodeHtmlEntities(cat.name).toUpperCase()} {cat.count !== undefined ? `(${cat.count})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* 3. FILTER / SORT BAR */}
      <div className="bg-[#F8F7F4] border border-[#D8D4CD] rounded-xl p-3.5 mb-8 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#292725]">
            <Filter className="w-4 h-4 text-[#C91F26]" />
            <span>Filter:</span>
          </div>

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="bg-[#F3F1ED] border border-[#D8D4CD] text-xs font-semibold text-[#292725] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#C91F26] cursor-pointer"
          >
            <option value="all">All Prices</option>
            <option value="under_2000">Under ₹2,000</option>
            <option value="2000_5000">₹2,000 - ₹5,000</option>
            <option value="above_5000">Above ₹5,000</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#716D67] cursor-pointer hover:text-[#292725]">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-[#C91F26] w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span>In-Stock Only</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#716D67]" />
          <span className="text-xs font-bold text-[#716D67]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#F3F1ED] border border-[#D8D4CD] text-xs font-semibold text-[#292725] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#C91F26] cursor-pointer"
          >
            <option value="featured">Featured / Best Match</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Main Category Products Grid */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#ffffff] rounded-lg border border-[#EFEAE6]">
          <h3 className="font-headline-md text-2xl font-bold text-[#2A2724]">No products available</h3>
          <p className="font-body-md text-sm text-[#514C48] mt-2">
            There are currently no products available in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayProducts.map((product) => renderProductCard(product))}
        </div>
      )}

      {/* DYNAMIC SUBCATEGORY COMPONENTS (Max 2 per category) */}
      {!activeSubCategoryId && dynamicSubcategorySections.map((subSection) => (
        <div key={subSection.id} className="mt-14 sm:mt-18 pt-10 border-t border-[#D8D4CD]">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h3 className="font-display-lg text-xl sm:text-2xl md:text-3xl font-extrabold text-[#292725] tracking-tight uppercase">
                {subSection.name}
              </h3>
            </div>
            <span className="text-xs text-[#716D67] font-semibold bg-[#EAE7E1] px-3 py-1 rounded-full self-start sm:self-auto border border-[#D8D4CD]">
              {subSection.products.length} {subSection.products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subSection.products.map((product) => renderProductCard(product))}
          </div>
        </div>
      ))}

      {isMixerCategory && accessoryProducts.length > 0 && (
        <AccessoriesSection
          accessories={accessoryProducts}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          cart={cart}
          onSelectProduct={onSelectProduct}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          addingId={addingId}
          addedId={addedId}
        />
      )}
    </section>
  );
};

export default ProductList;
