import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Plus,
  Zap,
  ShieldCheck,
  Flame,
  Award,
  ArrowRight,
  Truck,
  Lock,
  RotateCcw,
  Sparkles,
  CookingPot,
  Package,
  Layers
} from 'lucide-react';
import { getStoredReviews, getProductRatingData, sortProductsByRating } from '../hooks/useProducts';
import HeroBanner from '../components/Home/HeroBanner';

const Home = ({
  heroSlides,
  heroIndex,
  activeHeroSlide,
  prevHeroSlide,
  nextHeroSlide,
  bestsellers = [],
  flashDeals = [],
  electronicsProducts = [],
  utensilsProducts = [],
  allProducts = [],
  isProductsLoading = false,
  selectedProduct,
  setSelectedProduct,
  setProductQuantity,
  handleAddToCart,
  wishlist = [],
  toggleWishlist,
  isWishlisted,
  bestsellerScrollRef,
  dealScrollRef,
  electronicsScrollRef,
  utensilsScrollRef,
  scrollSideways,
  setCurrentView,
  searchQuery,
  onOpenPolicy
}) => {
  const [dbReviews, setDbReviews] = useState(() => getStoredReviews());

  useEffect(() => {
    const updateReviews = () => setDbReviews(getStoredReviews());
    window.addEventListener('modena_reviews_updated', updateReviews);
    return () => window.removeEventListener('modena_reviews_updated', updateReviews);
  }, []);

  const qualifyingReviews = dbReviews.filter((r) => Number(r.rating) >= 4);

  const trustBadges = [
    {
      icon: Truck,
      title: 'Free Express Shipping',
      desc: 'On all orders across India',
      policyTab: 'shipping'
    },
    {
      icon: Lock,
      title: '100% Secure Payment',
      desc: 'Zoho Pay SSL 256-bit encryption',
      policyTab: 'privacy'
    },
    {
      icon: RotateCcw,
      title: '7-Day Instant Replacement',
      desc: 'Hassle-free return policy',
      policyTab: 'returns'
    },
    {
      icon: ShieldCheck,
      title: 'Heritage Warranty',
      desc: 'Direct Modena service support',
      policyTab: 'warranty'
    }
  ];

  // Sort lists by weighted rating score algorithm (Count & Rating combined)
  const sortedElectronics = useMemo(() => sortProductsByRating(electronicsProducts), [electronicsProducts, dbReviews]);
  const sortedUtensils = useMemo(() => sortProductsByRating(utensilsProducts), [utensilsProducts, dbReviews]);
  const sortedAllProducts = useMemo(() => {
    const sourceList = allProducts && allProducts.length > 0 ? allProducts : bestsellers;
    return sortProductsByRating(sourceList);
  }, [allProducts, bestsellers, dbReviews]);

  // Helper for rendering horizontal product cards
  const renderProductCard = (item, badgeLabel = null) => {
    const isLiked = isWishlisted ? isWishlisted(item.id) : false;
    const isOut =
      item.isOutOfStock ||
      item.stock === 'Out of Stock' ||
      item.is_in_stock === false ||
      (item.categories || []).some(
        (c) => c.slug === 'out-of-stock' || (c.name || '').toLowerCase() === 'out of stock'
      );
    const badgeText = isOut ? 'OUT OF STOCK' : (badgeLabel || item.badge || 'HERITAGE');
    
    // Evaluate live rating data directly from database & local reviews
    const ratingData = getProductRatingData(item);
    const hasRating = ratingData.hasReviews;
    const ratingVal = ratingData.averageRating;
    const ratingCount = ratingData.ratingCount;

    return (
      <div
        key={item.id}
        className={`min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300 transition-all group flex-shrink-0 relative overflow-hidden ${
          isOut ? 'opacity-75 grayscale-[25%]' : ''
        }`}
      >
        <div>
          {/* Badge & Wishlist Overlay */}
          <div className="relative mb-3">
            <span
              className={`absolute top-2 left-2 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider ${
                isOut ? 'bg-stone-800' : 'bg-[#E60000]'
              }`}
            >
              {badgeText}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toggleWishlist) toggleWishlist(item);
              }}
              className="absolute top-2 right-2 z-10 w-8.5 h-8.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'fill-[#E60000] text-[#E60000]' : 'text-gray-400 hover:text-[#E60000]'
                }`}
              />
            </button>
            <div
              onClick={() => {
                if (setSelectedProduct) setSelectedProduct(item);
                if (setProductQuantity) setProductQuantity(1);
              }}
              className="w-full aspect-[4/3] bg-[#FAF8F6]/60 rounded-xl overflow-hidden flex items-center justify-center p-3 cursor-pointer border border-[#FAF8F6] relative"
            >
              {isOut && <div className="absolute inset-0 bg-stone-900/10 pointer-events-none rounded-xl" />}
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500 rounded-lg"
              />
            </div>
          </div>

          {/* Dynamic Rating Badge */}
          <div className="flex items-center gap-1.5 mb-2 text-xs">
            {hasRating ? (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-[#2A2724]">
                  {ratingVal.toFixed(1)} ({ratingCount})
                </span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">No reviews</span>
            )}
          </div>

          <h3
            onClick={() => {
              if (setSelectedProduct) setSelectedProduct(item);
              if (setProductQuantity) setProductQuantity(1);
            }}
            className="font-bold text-base text-[#2A2724] truncate mb-1 cursor-pointer hover:text-[#E60000] transition-colors leading-snug"
          >
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {item.desc || item.description || 'Premium Modena kitchenware engineered for longevity and high performance.'}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-[#2A2724]">{item.price}</span>
            {item.originalPrice && (
              <span className="text-xs text-gray-400 line-through font-medium">{item.originalPrice}</span>
            )}
          </div>
          {isOut ? (
            <button
              disabled
              className="bg-gray-200 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed border border-gray-300 flex items-center gap-1.5 opacity-80"
            >
              <span>OUT OF STOCK</span>
            </button>
          ) : (
            <button
              onClick={() =>
                handleAddToCart({
                  id: item.id,
                  name: item.name,
                  price: item.numericPrice || item.price,
                  price_html: item.price,
                  image: item.image,
                  isOutOfStock: item.isOutOfStock,
                  stock: item.stock
                })
              }
              className="bg-[#E60000] hover:bg-red-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ADD TO CART</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Prepare products for Product Showcase:
  // Desktop/Tablet: 6 visible + 3 faded
  // Mobile: 3 visible + 2 faded
  const visibleSixProducts = sortedAllProducts.slice(0, 6);
  const fadedDesktopProducts = sortedAllProducts.slice(6, 9);
  const fadedMobileProducts = sortedAllProducts.slice(3, 5);

  return (
    <div className="bg-[#EFEAE6] text-[#2A2724] min-h-screen">
      {/* 1. DYNAMIC HERO BANNER */}
      <HeroBanner
        categoryId="hero-banner"
        onSelectProduct={(product) => {
          if (setSelectedProduct) setSelectedProduct(product);
          if (setProductQuantity) setProductQuantity(1);
        }}
      />

      {/* 2. TRUST BADGES / USP BAR */}
      <section className="bg-white border-b border-gray-200/80 py-8 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, idx) => {
              const IconComp = badge.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (onOpenPolicy) {
                      onOpenPolicy(badge.policyTab);
                    } else if (setCurrentView) {
                      setCurrentView('storePolicies');
                    }
                  }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#E60000]/40 transition-all duration-300 flex items-center gap-4 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E60000]/10 text-[#E60000] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E60000] group-hover:text-white transition-colors duration-300">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#2A2724] group-hover:text-[#E60000] transition-colors">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. ELECTRONICS HORIZONTAL PRODUCT SLIDER SECTION */}
      <section className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2A2724] tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              <span>Electronics</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollSideways(electronicsScrollRef, 'left')}
              aria-label="Scroll Electronics Left"
              className="bg-white hover:bg-[#E60000] hover:text-white border border-gray-200 text-[#2A2724] p-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollSideways(electronicsScrollRef, 'right')}
              aria-label="Scroll Electronics Right"
              className="bg-white hover:bg-[#E60000] hover:text-white border border-gray-200 text-[#2A2724] p-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={electronicsScrollRef}
          className="flex gap-6 overflow-x-auto snap-x scrollbar-none pb-6 pt-2"
        >
          {isProductsLoading ? (
            <div className="flex gap-6 overflow-hidden py-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[280px] sm:min-w-[320px] h-[380px] bg-gray-200 animate-pulse rounded-2xl border border-gray-200"
                />
              ))}
            </div>
          ) : sortedElectronics.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm font-semibold w-full bg-white rounded-2xl border border-gray-200">
              No electronic appliances currently available in the database
            </div>
          ) : (
            sortedElectronics.map((item) => renderProductCard(item, 'ELECTRONICS'))
          )}
        </div>
      </section>

      {/* 4. UTENSILS HORIZONTAL PRODUCT SLIDER SECTION */}
      <section className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2A2724] tracking-tight flex items-center gap-2">
              <CookingPot className="w-6 h-6 text-[#E60000]" />
              <span>Utensils</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollSideways(utensilsScrollRef, 'left')}
              aria-label="Scroll Utensils Left"
              className="bg-white hover:bg-[#E60000] hover:text-white border border-gray-200 text-[#2A2724] p-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollSideways(utensilsScrollRef, 'right')}
              aria-label="Scroll Utensils Right"
              className="bg-white hover:bg-[#E60000] hover:text-white border border-gray-200 text-[#2A2724] p-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={utensilsScrollRef}
          className="flex gap-6 overflow-x-auto snap-x scrollbar-none pb-6 pt-2"
        >
          {isProductsLoading ? (
            <div className="flex gap-6 overflow-hidden py-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[280px] sm:min-w-[320px] h-[380px] bg-gray-200 animate-pulse rounded-2xl border border-gray-200"
                />
              ))}
            </div>
          ) : sortedUtensils.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm font-semibold w-full bg-white rounded-2xl border border-gray-200">
              No utensils or cookware currently available in the database
            </div>
          ) : (
            sortedUtensils.map((item) => renderProductCard(item, 'UTENSILS'))
          )}
        </div>
      </section>

      {/* 5. MAIN PRODUCT SHOWCASE / OUR SIGNATURE COLLECTION */}
      <section className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#2A2724] tracking-tight">
            Our Signature Collection
          </h2>
        </div>

        {/* Visible Products Grid: 6 on Desktop, 3 on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {visibleSixProducts.map((item, idx) => {
            const isLiked = isWishlisted ? isWishlisted(item.id) : false;
            const ratingData = getProductRatingData(item);
            const hasRating = ratingData.hasReviews;
            const ratingVal = ratingData.averageRating;
            const ratingCount = ratingData.ratingCount;
            const hideOnMobile = idx >= 3;

            const isOut =
              item.isOutOfStock ||
              item.stock === 'Out of Stock' ||
              item.is_in_stock === false ||
              (item.categories || []).some(
                (c) => c.slug === 'out-of-stock' || (c.name || '').toLowerCase() === 'out of stock'
              );

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-gray-200/80 p-5 flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300 transition-all group relative overflow-hidden ${
                  hideOnMobile ? 'hidden sm:flex' : 'flex'
                } ${isOut ? 'opacity-75 grayscale-[25%]' : ''}`}
              >
                <div>
                  <div className="relative mb-4">
                    <span
                      className={`absolute top-2.5 left-2.5 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider ${
                        isOut ? 'bg-stone-800' : 'bg-[#E60000]'
                      }`}
                    >
                      {isOut ? 'OUT OF STOCK' : item.badge || 'HERITAGE'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (toggleWishlist) toggleWishlist(item);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isLiked ? 'fill-[#E60000] text-[#E60000]' : 'text-gray-400 hover:text-[#E60000]'
                        }`}
                      />
                    </button>
                    <div
                      onClick={() => {
                        if (setSelectedProduct) setSelectedProduct(item);
                        if (setProductQuantity) setProductQuantity(1);
                      }}
                      className="w-full aspect-[4/3] bg-[#FAF8F6]/60 rounded-xl overflow-hidden flex items-center justify-center p-4 cursor-pointer border border-[#FAF8F6] relative"
                    >
                      {isOut && <div className="absolute inset-0 bg-stone-900/10 pointer-events-none rounded-xl" />}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Dynamic Rating Badge */}
                  <div className="flex items-center gap-1.5 mb-2 text-xs">
                    {hasRating ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-[#2A2724]">
                          {ratingVal.toFixed(1)} ({ratingCount})
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">No reviews</span>
                    )}
                  </div>

                  <h3
                    onClick={() => {
                      if (setSelectedProduct) setSelectedProduct(item);
                      if (setProductQuantity) setProductQuantity(1);
                    }}
                    className="font-bold text-lg text-[#2A2724] truncate mb-1.5 cursor-pointer hover:text-[#E60000] transition-colors leading-snug"
                  >
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    {item.desc || item.description || 'Modena signature cookware engineered for durability and elegance.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-xl text-[#2A2724]">{item.price}</span>
                    {item.originalPrice && (
                      <span className="text-xs text-gray-400 line-through font-medium">{item.originalPrice}</span>
                    )}
                  </div>
                  {isOut ? (
                    <button
                      disabled
                      className="bg-gray-200 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed border border-gray-300 flex items-center gap-1.5 opacity-80"
                    >
                      <span>OUT OF STOCK</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleAddToCart({
                          id: item.id,
                          name: item.name,
                          price: item.numericPrice || item.price,
                          price_html: item.price,
                          image: item.image,
                          isOutOfStock: item.isOutOfStock,
                          stock: item.stock
                        })
                      }
                      className="bg-[#E60000] hover:bg-red-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>ADD TO CART</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Faded/Gradient Area with Products & Prominent "More Products" Button */}
        {(fadedDesktopProducts.length > 0 || fadedMobileProducts.length > 0) && (
          <div className="relative mt-2">
            {/* Desktop Faded Background Products (Products 7, 8, 9) */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-40 blur-[1px] pointer-events-none select-none">
              {fadedDesktopProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-4 mb-4">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 truncate mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.desc || item.description}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                    <span className="font-extrabold text-xl text-gray-700">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Faded Background Products (Products 4, 5) */}
            <div className="grid sm:hidden grid-cols-1 gap-6 opacity-40 blur-[1px] pointer-events-none select-none">
              {fadedMobileProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-4 mb-4">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 truncate mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.desc || item.description}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                    <span className="font-extrabold text-xl text-gray-700">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient Overlay & Centered "More Products" CTA Button */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#EFEAE6] via-[#EFEAE6]/90 to-transparent flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="bg-white/80 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-md">
                <span className="text-xs font-extrabold text-[#E60000] tracking-widest uppercase mb-2">
                  DISCOVER MORE PRODUCTS
                </span>
                <h3 className="font-extrabold text-xl md:text-2xl text-[#2A2724] mb-2">
                  Explore Full Modena Catalog
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-6 font-medium">
                  Browse our complete line of heavy 990W mixer grinders, tri-ply cookware, and cast iron pans.
                </p>
                <button
                  onClick={() => setCurrentView('products')}
                  className="bg-[#E60000] hover:bg-[#E60000] text-white text-sm md:text-base font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 cursor-pointer group border border-white/20"
                >
                  <span>MORE PRODUCTS</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6. VERIFIED REVIEWS SECTION */}
      <section id="reviews-section" className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2A2724] tracking-tight">
              Authentic Customer Reviews
            </h2>
          </div>
        </div>

        {qualifyingReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {qualifyingReviews.slice(0, 6).map((rev, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(Number(rev.rating) || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 italic mb-6 leading-relaxed">
                    "{rev.review || rev.comment || rev.text}"
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#2A2724]">
                    {rev.reviewer || rev.author || 'Verified Buyer'}
                  </h4>
                  <span className="text-xs text-gray-500 font-medium">
                    {rev.verified ? 'Verified Purchaser' : 'Customer Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-3 shadow-xs">
            <div className="flex justify-center text-gray-300 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-gray-300" />
              ))}
            </div>
            <div className="text-xs font-bold text-gray-400">☆☆☆☆☆ 0.0 (0 Reviews)</div>
            <h3 className="font-extrabold text-xl text-[#2A2724]">No reviews</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
              No customer reviews have been submitted yet in our database. Be the first to share your experience on any Modena product!
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
