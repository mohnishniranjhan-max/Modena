import React, { useState, useEffect } from 'react';
import { Check, Star, Plus, RefreshCw, AlertCircle } from 'lucide-react';

const CONSUMER_KEY = 'ck_44ce4325fc8396012c1fb6bc4a9318e3b5c7fff0';

const ProductList = ({ onAddToCart, searchQuery = '', selectedCategory = null }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(selectedCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const fetchWordPressCategories = async () => {
    const catEndpoints = [
      `/wp-json/wc/store/products/categories`,
      `/wp-json/wc/store/categories`,
      `/wp-json/wp/v2/products/categories`
    ];

    for (const url of catEndpoints) {
      try {
        const res = await fetch(`${url}?timestamp=${new Date().getTime()}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            break;
          }
        }
      } catch {
        // Silently try next category endpoint
      }
    }
  };

  const fetchWordPressProducts = async (catId = activeCategoryId) => {
    setLoading(true);
    setError(null);

    const categoryParam = catId ? `&category=${catId}` : '';
    const categoryParamFirst = catId ? `?category=${catId}` : '';

    const endpoints = [
      `/wp-json/wc/store/v1/products?consumer_key=${CONSUMER_KEY}${categoryParam}`,
      `/wp-json/wc/store/products?consumer_key=${CONSUMER_KEY}${categoryParam}`,
      `/wp-json/wc/store/v1/products${categoryParamFirst}`,
      `/wp-json/wc/store/products${categoryParamFirst}`
    ];

    let fetchedData = null;

    try {
      const res = await fetch(`/wp-json/wc/store/products?timestamp=${new Date().getTime()}${categoryParam}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          fetchedData = data;
        }
      }
    } catch {
      // Continue to fallback endpoints if primary fetch fails
    }

    if (!fetchedData) {
      for (const url of endpoints) {
        try {
          const cacheBustedUrl = url.includes('?') 
            ? `${url}&timestamp=${new Date().getTime()}` 
            : `${url}?timestamp=${new Date().getTime()}`;
          const res = await fetch(cacheBustedUrl);
          const contentType = res.headers.get('content-type') || '';

          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              fetchedData = data;
              break;
            }
          }
        } catch {
          // Silently try next endpoint
        }
      }
    }

    if (fetchedData) {
      // Filter ONLY physical products (exclude virtual products)
      let physicalOnly = fetchedData.filter(
        (product) =>
          !product.virtual &&
          !product.is_virtual &&
          product.type !== 'virtual'
      );

      // Client-side category filter fallback if catId is set
      if (catId) {
        physicalOnly = physicalOnly.filter((product) => {
          if (!product.categories || !Array.isArray(product.categories)) return false;
          return product.categories.some((c) => c.id === catId || c.slug === catId || c.name.toLowerCase() === String(catId).toLowerCase());
        });
      }

      setProducts(physicalOnly);
    } else {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWordPressCategories();
    fetchWordPressProducts(selectedCategory);
  }, [selectedCategory]);

  // Filter & Sort Products: Bestsellers appear first!
  const displayProducts = React.useMemo(() => {
    let list = [...products];

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
  }, [products, searchQuery]);

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
          Fetching Products from WordPress Catalog...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
        <div className="bg-[#fff0ee] border border-[#e9bcb5] p-8 rounded-lg inline-block max-w-md">
          <AlertCircle className="w-10 h-10 text-[#b70100] mx-auto mb-3" />
          <h3 className="font-headline-md text-lg text-[#2a1613] font-medium mb-2">WordPress Sync Notice</h3>
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
          <span className="font-label-caps text-[#b70100] tracking-widest block mb-2">
            WORDPRESS STORE CATALOG
          </span>
          <h2 className="font-display-lg text-3xl md:text-4xl text-[#2a1613] tracking-tight">
            Physical Store Products
          </h2>
        </div>
        <p className="font-body-md text-[#5f3f3a] max-w-md mt-4 md:mt-0 text-sm">
          Loaded directly via WooCommerce Store API. Filtered by WooCommerce Categories.
        </p>
      </div>

      {/* WooCommerce Dynamic Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-8">
        <button
          onClick={() => {
            setActiveCategoryId(null);
            fetchWordPressProducts(null);
          }}
          className={`px-4 py-2 rounded-full font-label-caps text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeCategoryId === null
              ? 'bg-[#b70100] text-white shadow-md font-bold'
              : 'bg-[#ffffff] text-[#5c5957] hover:bg-[#fff0ee] border border-[#e8e1dc]'
          }`}
        >
          All Products
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategoryId(cat.id);
              fetchWordPressProducts(cat.id);
            }}
            className={`px-4 py-2 rounded-full font-label-caps text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeCategoryId === cat.id
                ? 'bg-[#b70100] text-white shadow-md font-bold'
                : 'bg-[#ffffff] text-[#5c5957] hover:bg-[#fff0ee] border border-[#e8e1dc]'
            }`}
          >
            {cat.name} {cat.count !== undefined ? `(${cat.count})` : ''}
          </button>
        ))}
      </div>

      {/* Product List or Empty State */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#ffffff] rounded-lg border border-[#e8e1dc]">
          <h3 className="font-headline-md text-2xl font-bold text-[#2a1613]">No products found</h3>
          <p className="font-body-md text-sm text-[#5c5957] mt-2">
            {searchQuery ? `No products matched your search query "${searchQuery}".` : 'There are currently no products in the website database.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((product) => {
            const imageSrc =
              product.images?.[0]?.src ||
              product.images?.[0]?.thumbnail ||
              'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
            const imageAlt = product.images?.[0]?.alt || product.name;
            const isAdding = addingId === product.id;
            const isAdded = addedId === product.id;

            return (
              <div
                key={product.id}
                className="group bg-[#ffffff] rounded-lg border border-[#e9bcb5]/40 p-5 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {/* Product Image Container (Dynamic sizing for any image aspect ratio, no offer tag on image) */}
                <div className="w-full min-h-[220px] max-h-[340px] bg-[#fff0ee] rounded-md overflow-hidden relative mb-5 flex items-center justify-center p-3 transition-all duration-300">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-auto max-h-[320px] object-contain rounded transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2 text-xs text-[#5c5957]">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-medium text-[#2a1613] ml-1">
                    {product.average_rating || '5.0'}
                  </span>
                  <span className="text-[#946e68]">({product.review_count || 12})</span>
                </div>

                {/* Product Name */}
                <h3 className="font-headline-md text-lg text-[#2a1613] tracking-tight group-hover:text-[#b70100] transition-colors mb-1.5 capitalize">
                  {product.name}
                </h3>

                {/* Description */}
                <div
                  className="font-body-md text-xs text-[#5f3f3a] line-clamp-2 mb-4 [&_.screen-reader-text]:hidden"
                  dangerouslySetInnerHTML={{
                    __html: product.description || product.short_description || 'High quality physical product from WooCommerce.'
                  }}
                />

                {/* Price & Add to Cart Footer */}
                <div className="mt-auto pt-3 border-t border-[#ffe9e6] flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-[#5c5957] block font-label-caps tracking-wider">PRICE</span>
                    {renderProductPrice(product)}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdding}
                    className={`flex-shrink-0 py-2 px-3.5 rounded font-headline-md text-xs tracking-wide flex items-center gap-1 transition-all duration-200 ${
                      isAdded
                        ? 'bg-emerald-700 text-white shadow-md'
                        : isAdding
                        ? 'bg-[#5c5957] text-white cursor-wait'
                        : 'bg-[#b70100] hover:bg-[#e60000] text-white shadow-[0_4px_12px_rgba(183,1,0,0.2)] hover:shadow-[0_6px_16px_rgba(183,1,0,0.3)]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" /> Added
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
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProductList;
