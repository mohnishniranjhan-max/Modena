import React, { useState, useEffect } from 'react';
import { Check, Star, Plus, RefreshCw, AlertCircle, Heart, Zap, Truck, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { normalizeProduct, decodeHtmlEntities } from './hooks/useProducts';

const CONSUMER_KEY = 'ck_44ce4325fc8396012c1fb6bc4a9318e3b5c7fff0';

const ProductList = ({ onAddToCart, onSelectProduct, searchQuery = '', selectedCategory = null, selectedCategoryName = null, wishlist = [], onToggleWishlist }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  // Reset activeSubCategoryId whenever page view/category changes
  useEffect(() => {
    setActiveSubCategoryId(null);
  }, [selectedCategoryName]);

  const fetchWordPressCategories = async () => {
    try {
      const res = await fetch(`/wp-json/wc/store/products/categories?per_page=100&timestamp=${new Date().getTime()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const cleaned = data.map((c) => ({
            ...c,
            name: decodeHtmlEntities(c.name)
          }));
          setCategories(cleaned);
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
    if (!selectedCategoryName || selectedCategoryName === 'home' || selectedCategoryName === 'all') {
      const mainCats = categories.filter((c) => !c.parent || c.parent === 0 || c.parent_id === 0);
      return {
        currentParentCategory: null,
        displayCategories: mainCats.length > 0 ? mainCats : categories,
        categoryFilteredProducts: products
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
      const pCat = (p.category || '').toLowerCase();
      const pCats = (p.categories || []).map((c) => ((c.name || '') + ' ' + (c.slug || '')).toLowerCase()).join(' ');
      return pCat.includes(targetName) || pCats.includes(targetName);
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

    // Always sort Bestsellers / Featured items to the top!
    list.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const scoreA = (a.on_sale ? 50 : 0) + (nameA.includes('sindoor') || nameA.includes('990w') ? 100 : 0);
      const scoreB = (b.on_sale ? 50 : 0) + (nameB.includes('sindoor') || nameB.includes('990w') ? 100 : 0);
      return scoreB - scoreA;
    });

    return list;
  }, [categoryFilteredProducts, activeSubCategoryId, categories, searchQuery]);

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
            <span className="font-headline-md text-xl text-[#2a1613] font-bold">
              {symbol}{currentPrice}
            </span>
            <span className="text-xs text-[#946e68] line-through font-body-md">
              {symbol}{regularPrice}
            </span>
          </div>
        );
      }

      return (
        <span className="font-headline-md text-xl text-[#2a1613] font-bold">
          {symbol}{currentPrice}
        </span>
      );
    }

    if (product.price_html) {
      return (
        <div
          className="font-headline-md text-base text-[#2a1613] font-medium leading-snug [&_.screen-reader-text]:hidden [&_ins]:no-underline [&_ins]:font-bold [&_del]:text-xs [&_del]:text-[#946e68] [&_del]:mr-1"
          dangerouslySetInnerHTML={{ __html: product.price_html }}
        />
      );
    }

    return (
      <span className="font-headline-md text-xl text-[#2a1613] font-bold">
        ₹{product.price || 0}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#b70100] border-t-transparent"></div>
        <p className="mt-4 font-headline-md text-lg text-[#5c5957]">
          Loading Modena Collection...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
        <div className="bg-[#fff0ee] border border-[#e9bcb5] p-8 rounded-lg inline-block max-w-md">
          <AlertCircle className="w-10 h-10 text-[#b70100] mx-auto mb-3" />
          <h3 className="font-headline-md text-lg text-[#2a1613] font-medium mb-2">Store Catalog Notice</h3>
          <p className="font-body-md text-xs text-[#5f3f3a] mb-6">{error}</p>
          <button
            onClick={fetchWordPressProducts}
            className="bg-[#b70100] hover:bg-[#e60000] text-white px-5 py-2.5 rounded font-label-caps text-xs flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> RETRY SYNC
          </button>
        </div>
      </div>
    );
  }

  return (
    <section id="products-section" className="max-w-[1280px] mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-[#e9bcb5]/40 pb-6">
        <div>
          <span className="font-label-caps text-[#b70100] tracking-widest block mb-2 uppercase">
            PREMIUM STORE CATALOG
          </span>
          <h2 className="font-display-lg text-3xl md:text-4xl text-[#2a1613] tracking-tight">
            {selectedCategoryName && selectedCategoryName !== 'home' && selectedCategoryName !== 'all'
              ? `${selectedCategoryName.toUpperCase()} PRODUCTS`
              : 'Our Signature Collection'}
          </h2>
        </div>
        <p className="font-body-md text-[#5f3f3a] max-w-md mt-4 md:mt-0 text-sm leading-relaxed">
          Handcrafted heavy-duty appliances &amp; culinary utensils engineered for lifelong performance.
        </p>
      </div>

      {/* WooCommerce Dynamic Category / Subcategory Filter Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <button
          onClick={() => setActiveSubCategoryId(null)}
          className={`px-4.5 py-2 rounded-full font-label-caps text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeSubCategoryId === null
              ? 'bg-[#b70100] text-white shadow-md font-bold'
              : 'bg-[#ffffff] text-[#5c5957] hover:bg-[#fff0ee] border border-[#e8e1dc]'
          }`}
        >
          {selectedCategoryName && selectedCategoryName !== 'home' && selectedCategoryName !== 'all'
            ? `ALL ${selectedCategoryName.toUpperCase()} (${categoryFilteredProducts.length})`
            : `HOME (ALL PRODUCTS) (${categoryFilteredProducts.length})`}
        </button>

        {displayCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveSubCategoryId(cat.id)}
            className={`px-4.5 py-2 rounded-full font-label-caps text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeSubCategoryId === cat.id
                ? 'bg-[#b70100] text-white shadow-md font-bold'
                : 'bg-[#ffffff] text-[#5c5957] hover:bg-[#fff0ee] border border-[#e8e1dc]'
            }`}
          >
            {decodeHtmlEntities(cat.name).toUpperCase()} {cat.count !== undefined ? `(${cat.count})` : ''}
          </button>
        ))}
      </div>

      {/* Creative Amazon-Style Spec Quick Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
        {[
          { label: '⚡ 990W Heavy Motor', filter: 'mixer' },
          { label: '🍳 Virgin Cast Iron', filter: 'cast iron' },
          { label: '🛡️ 5-Year Warranty', filter: 'warranty' },
          { label: '🚚 Free Express Delivery', filter: 'delivery' },
          { label: '⭐ 4.5+ Top Rated', filter: 'rated' },
          { label: '🔥 Flash Sale Offers', filter: 'sale' },
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (chip.filter === 'mixer') setActiveSubCategoryId(null);
            }}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-white border border-[#e8e1dc] text-[#2a1613] hover:border-[#b70100] hover:text-[#b70100] transition-all whitespace-nowrap flex-shrink-0 shadow-xs cursor-pointer hover:scale-102 active:scale-98"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Product List or Empty State */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#ffffff] rounded-lg border border-[#e8e1dc]">
          <h3 className="font-headline-md text-2xl font-bold text-[#2a1613]">No products available</h3>
          <p className="font-body-md text-sm text-[#5c5957] mt-2">
            There are currently no products available in the database.
          </p>
        </div>
      ) : (
        <div className="physics-container w-full">
          <div className="grid grid-cols-1 @[700px]:grid-cols-2 @[1100px]:grid-cols-3 gap-6">
            {displayProducts.map((product) => {
              const rawImg = product.image || product.images?.[0]?.src || product.images?.[0]?.thumbnail;
              const imageSrc = (!rawImg || rawImg.includes('1584992236310-6edddc08acff'))
                ? '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'
                : rawImg;
              const imageAlt = product.images?.[0]?.alt || product.name;
              const isAdding = addingId === product.id;
              const isAdded = addedId === product.id;

              const isWishlisted = wishlist.some((p) => p.id === product.id);

              return (
                <div
                  key={product.id}
                  className="group bg-[#ffffff] rounded-2xl border border-[#e9bcb5]/40 p-4 sm:p-5 flex flex-col sm:flex-row @[700px]:flex-col gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Left Side (Image & Amazon-Style Badging - Optimized 4:3 Aspect Ratio) */}
                  <div
                    onClick={() => onSelectProduct && onSelectProduct(product)}
                    className="w-full sm:w-52 @[700px]:w-full aspect-[4/3] bg-[#fff0ee]/70 rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center p-2.5 transition-all duration-300 cursor-pointer border border-[#ffe9e6]"
                  >
                    {/* Modena's Choice Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 bg-[#111111] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      <span>Modena's Choice</span>
                    </div>

                    {/* Wishlist Button Overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist && onToggleWishlist(product);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#e9bcb5]/50 flex items-center justify-center shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-[#b70100] text-[#b70100]' : 'text-gray-400 hover:text-[#b70100]'}`} />
                    </button>

                    <img
                      src={imageSrc}
                      alt={imageAlt}
                      className="w-full h-full object-contain rounded transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Right Side (Amazon Product Info & Deal Specs) */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Category Tag & Free Delivery Tag */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-extrabold bg-[#fff0ee] text-[#b70100] border border-[#ffe9e6] px-2 py-0.5 rounded uppercase tracking-wider">
                          {product.category || 'PREMIUM CULINARY'}
                        </span>
                        <span className="text-[9.5px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                          <Truck className="w-3 h-3 text-emerald-700" /> FREE Delivery Mon, 17 Aug
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3
                        onClick={() => onSelectProduct && onSelectProduct(product)}
                        className="font-headline-md text-sm sm:text-base font-bold text-[#2a1613] tracking-tight group-hover:text-[#b70100] transition-colors mb-1 cursor-pointer line-clamp-2"
                      >
                        {product.name}
                      </h3>

                      {/* Ratings Row */}
                      <div className="flex items-center gap-1.5 mb-2 text-xs">
                        <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[11px] flex items-center gap-0.5">
                          {product.average_rating || '4.8'} <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        </span>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-gray-500 text-[11px]">({product.review_count || 128})</span>
                      </div>

                      {/* Pricing & Amazon Deal Off Pill */}
                      <div className="mb-2">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {renderProductPrice(product)}
                          <span className="text-[10px] font-extrabold bg-red-100 text-[#b70100] px-2 py-0.5 rounded">
                            49% OFF
                          </span>
                        </div>
                        <p className="text-[10.5px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                          <span>Save extra with No Cost EMI &amp; Instant Bank Offer</span>
                        </p>
                      </div>
                    </div>

                    {/* Stock Status & Add to Cart Button */}
                    <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row @[700px]:flex-col items-start sm:items-center @[700px]:items-stretch justify-between gap-2.5">
                      <span className="text-[10.5px] text-red-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        <span>Only 1 left in stock.</span>
                      </span>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdding}
                        className={`w-full py-2.5 px-4 rounded-xl font-headline-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm ${
                          isAdded
                            ? 'bg-emerald-700 text-white shadow-md'
                            : isAdding
                            ? 'bg-[#5c5957] text-white cursor-wait'
                            : 'bg-[#111111] hover:bg-[#b70100] text-white hover:shadow-lg'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" /> Added to Cart
                          </>
                        ) : isAdding ? (
                          'Adding...'
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductList;

