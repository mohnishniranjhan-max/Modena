import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { decodeHtmlEntities, normalizeProduct } from '../../hooks/useProducts';

/**
 * HeroBanner Component
 * Data-driven Hero Banner that strictly fetches products from the WooCommerce 'hero-banner' category.
 * Desktop Layout: 16:7 aspect ratio banner with details on left and product image on pedestal right.
 * Mobile Layout: Full-bleed product image top half, content card overlapping bottom â€” premium e-commerce style.
 */
const HeroBanner = ({
  categoryId = 'hero-banner',
  onSelectProduct
}) => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHeroBanners = async () => {
      setIsLoading(true);
      try {
        // Fetch dedicated Hero Banners CPT with linked WooCommerce products (Single Source of Truth)
        const customUrl = `/wp-json/modena/v1/hero-banners?timestamp=${new Date().getTime()}`;
        const response = await fetch(customUrl, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const customBanners = await response.json();
          if (Array.isArray(customBanners)) {
            const mappedSlides = customBanners.map((banner) => {
              const linkedProd = banner.linked_product;
              const hasValidProduct = linkedProd && linkedProd.is_valid !== false;

              const rawProduct = hasValidProduct
                ? {
                    id: linkedProd.id,
                    name: linkedProd.name || banner.title,
                    title: linkedProd.name || banner.title,
                    price: linkedProd.price,
                    price_html: linkedProd.price_html,
                    image: linkedProd.image || banner.banner_image,
                    permalink: linkedProd.permalink,
                    desc: linkedProd.short_description,
                    short_description: linkedProd.short_description,
                    rawProduct: linkedProd
                  }
                : null;

              const rawDesc = banner.short_description || (hasValidProduct ? linkedProd.short_description : '') || '';
              const cleanShortDesc = decodeHtmlEntities(rawDesc)
                .replace(/<[^>]*>?/gm, '')
                .trim();

              const slideTitle = banner.title || (hasValidProduct ? linkedProd.name : 'MODENA CULINARY PRODUCT');

              return {
                id: banner.id,
                name: slideTitle.toUpperCase(),
                short_description: cleanShortDesc || 'Engineered for commercial power, durability, and high performance.',
                image: banner.banner_image || (hasValidProduct ? linkedProd.image : ''),
                price: hasValidProduct ? (linkedProd.price_html || linkedProd.price) : null,
                rawProduct: rawProduct,
                badge: banner.badge || 'INTRODUCING MODENA',
                ctaText: banner.cta_text || 'SHOP BESTSELLER NOW',
                linkedProduct: rawProduct,
                isValidProduct: hasValidProduct
              };
            });

            if (isMounted) {
              setSlides(mappedSlides);
              setIsLoading(false);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('HeroBanner Fetch Error:', err.message);
      }

      if (isMounted) {
        setSlides([]);
        setIsLoading(false);
      }
    };

    fetchHeroBanners();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Periodic Auto-Play Slideshow (5 Seconds Interval)
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, slides.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleSelectProduct = (productObj) => {
    if (!onSelectProduct) return;
    const normalized = normalizeProduct(productObj);
    onSelectProduct(normalized);
  };

  // 1. Loading Skeleton View (Matches current banner layout & studio styling)
  if (isLoading) {
    return (
      <div className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 pt-2 pb-2">
        {/* Mobile Skeleton (< 640px) */}
        <div className="sm:hidden relative w-full rounded-[28px] overflow-hidden bg-[#2A2724] border border-white/10 shadow-2xl animate-pulse">
          {/* Top 16:7 Aspect Ratio Image Area */}
          <div className="relative w-full aspect-[16/7] bg-[#1A1816] flex items-center justify-center" style={{ aspectRatio: '16 / 7' }}>
            <div className="w-32 h-20 bg-stone-800/50 rounded-xl" />
          </div>
          {/* Bottom Content Card Area */}
          <div className="p-5 space-y-3.5 bg-[#2A2724]">
            <div className="w-32 h-5 bg-[#E60000]/25 border border-[#E60000]/30 rounded-full" />
            <div className="space-y-2">
              <div className="w-4/5 h-6 bg-stone-800/90 rounded-lg" />
              <div className="w-3/5 h-6 bg-stone-800/70 rounded-lg" />
            </div>
            <div className="space-y-1.5 pt-0.5">
              <div className="w-full h-3.5 bg-stone-800/50 rounded" />
              <div className="w-4/5 h-3.5 bg-stone-800/40 rounded" />
            </div>
            <div className="w-full h-12 bg-[#E60000]/80 rounded-2xl mt-2" />
          </div>
        </div>

        {/* Desktop Skeleton (>= 640px) */}
        <div className="hidden sm:block">
          <div 
            className="relative w-full aspect-[16/7] rounded-[24px] overflow-hidden bg-[#0D0504] border border-white/10 shadow-2xl flex items-center justify-between px-8 lg:px-16 animate-pulse"
            style={{ aspectRatio: '16 / 7' }}
          >
            {/* Left side: Artwork / studio lighting aura */}
            <div className="w-1/2 h-full flex items-center justify-center relative pointer-events-none">
              <div className="w-64 h-64 lg:w-84 lg:h-84 rounded-full bg-stone-900/60 border border-stone-800/30 flex items-center justify-center">
                <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-2xl bg-stone-800/30" />
              </div>
            </div>

            {/* Right side: Product Details & CTA */}
            <div className="relative z-20 w-full lg:w-[48%] ml-auto flex flex-col justify-center space-y-3.5 text-left">
              {/* Badge */}
              <div className="w-36 h-6 bg-[#E60000]/20 border border-[#E60000]/40 rounded-full" />
              
              {/* Headline (2 lines) */}
              <div className="space-y-2.5">
                <div className="w-11/12 h-8 lg:h-10 bg-stone-800/90 rounded-xl" />
                <div className="w-3/4 h-8 lg:h-10 bg-stone-800/70 rounded-xl" />
              </div>

              {/* Tagline / Description (2 lines) */}
              <div className="space-y-2 pt-1">
                <div className="w-full h-4 bg-stone-800/50 rounded-md" />
                <div className="w-4/5 h-4 bg-stone-800/40 rounded-md" />
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <div className="w-52 h-11 bg-[#E60000]/90 rounded-full shadow-lg shadow-red-950/50" />
              </div>
            </div>

            {/* Bottom Pagination Dots Skeleton (Bottom Left) */}
            <div className="absolute bottom-5 left-8 lg:left-16 flex items-center gap-2">
              <div className="w-6 h-1.5 bg-[#E60000]/60 rounded-full" />
              <div className="w-2 h-1.5 bg-stone-700/60 rounded-full" />
              <div className="w-2 h-1.5 bg-stone-700/60 rounded-full" />
            </div>

            {/* Bottom Navigation Arrows Skeleton (Bottom Right) */}
            <div className="absolute bottom-5 right-8 lg:right-16 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div className="w-10 h-10 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. No Products State
  if (slides.length === 0) {
    return (
      <div className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 pt-2 pb-2">
        <div 
          className="relative w-full aspect-[16/7] rounded-[24px] overflow-hidden bg-gradient-to-r from-[#2A2724] via-[#2A2724] to-[#2A2724] border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center p-8 space-y-3"
          style={{ aspectRatio: '16 / 7' }}
        >
          <div className="w-12 h-12 rounded-full bg-[#E60000]/20 border border-[#E60000]/40 flex items-center justify-center text-[#EFEAE6] mb-1">
            <Sparkles className="w-6 h-6 text-[#EFEAE6]" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white uppercase tracking-tight font-display-lg">
            no hero banner
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md leading-relaxed">
            No hero banners are currently published under <code className="bg-white/10 px-2 py-0.5 rounded text-amber-300 font-mono">Hero Banners</code> in WordPress Admin.
          </p>
        </div>
      </div>
    );
  }

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <div
      className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 pt-2 pb-2"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >

      {/* ============================== */}
      {/* MOBILE HERO BANNER (< 640px)   */}
      {/* ============================== */}
      <div className="sm:hidden relative w-full rounded-[28px] overflow-hidden bg-[#2A2724] border border-white/10 shadow-2xl">

        {/* Full-Bleed Product Image — Top Half (16:7 Aspect Ratio) */}
        <div className="relative w-full aspect-[16/7] overflow-hidden" style={{ aspectRatio: '16 / 7' }}>
          {slides.map((slide, index) => (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.name}
                  onClick={() => handleSelectProduct(slide.rawProduct || slide)}
                  className={`w-full h-full object-cover object-center transition-transform duration-[5000ms] ease-out select-none cursor-pointer ${
                    index === currentIndex ? 'scale-105' : 'scale-100'
                  }`}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-[#2A2724]" />
              )}
            </div>
          ))}

          {/* Gradient: image blends seamlessly into the content card below */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(13,5,4,0.7) 75%, #2A2724 100%)'
            }}
          />

          {/* Subtle red ambient tint */}
          <div className="absolute inset-0 bg-red-800/5 pointer-events-none" />

          {/* Mobile Prev/Next arrows â€” inside image */}
          {slides.length > 1 && (
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                aria-label="Previous"
                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                aria-label="Next"
                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Pagination dots â€” bottom-left of image */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    idx === currentIndex ? 'w-6 bg-[#E60000]' : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Card â€” pulls up with negative margin, blending with image gradient */}
        <div className="relative -mt-7 px-5 pt-4 pb-6 space-y-3 z-10 bg-gradient-to-b from-[#2A2724] to-[#2A2724]">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#E60000]/20 text-[#EFEAE6] border border-[#E60000]/40 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
            <Sparkles className="w-3 h-3 flex-shrink-0" />
            <span>{activeSlide.badge || 'INTRODUCING MODENA'}</span>
          </div>

          {/* Product Name */}
          <h1
            onClick={() => handleSelectProduct(activeSlide.rawProduct || activeSlide)}
            className="text-[21px] font-extrabold tracking-tight uppercase leading-[1.15] text-white font-display-lg cursor-pointer active:text-[#EFEAE6] transition-colors line-clamp-3"
          >
            {activeSlide.name}
          </h1>

          {/* Short Description */}
          {activeSlide.short_description && (
            <p className="text-[12.5px] text-gray-400 font-medium leading-relaxed line-clamp-2">
              {activeSlide.short_description}
            </p>
          )}

          {/* Price */}
          {activeSlide.price && (
            <div
              className="text-[15px] font-extrabold text-[#EFEAE6] leading-none"
              dangerouslySetInnerHTML={{ __html: activeSlide.price }}
            />
          )}

          {/* CTA â€” full width, easily tappable */}
          <button
            type="button"
            onClick={() => handleSelectProduct(activeSlide.rawProduct || activeSlide)}
            className="w-full bg-[#E60000] hover:bg-red-800 active:scale-[0.98] transition-all duration-200 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-red-950/40 flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider border border-red-500/20 mt-1"
          >
            <span>{activeSlide.ctaText || 'Shop Bestseller Now'}</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* ============================================= */}
      {/* DESKTOP / TABLET HERO BANNER (>= 640px)       */}
      {/* ============================================= */}
      <div className="hidden sm:block">
        <div 
          className="relative w-full aspect-[16/7] rounded-[24px] overflow-hidden bg-[#0D0504] shadow-2xl flex items-center justify-between px-8 lg:px-16"
          style={{ aspectRatio: '16 / 7' }}
        >

          {/* BACKGROUND SLIDES: Studio Hero Banner Artwork */}
          {slides.map((slide, index) => (
            <div
              key={slide.id || index}
              onClick={() => handleSelectProduct(slide.rawProduct || slide)}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${
                index === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {slide.image && (
                <img
                  src={slide.image}
                  alt={slide.name}
                  className={`w-full h-full object-cover object-left select-none transition-transform duration-[6000ms] ease-out ${
                    index === currentIndex ? 'scale-[1.02]' : 'scale-100'
                  }`}
                />
              )}
            </div>
          ))}

          {/* RIGHT COLUMN: Product Details & CTA */}
          <div className="relative z-20 w-full lg:w-[48%] ml-auto flex flex-col justify-center space-y-3.5 text-left pointer-events-none">
            {/* Top Badge */}
            <div className="self-start inline-flex items-center gap-2 bg-[#E60000]/20 text-[#EFEAE6] border border-[#E60000]/40 text-[10px] lg:text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-widest transition-all duration-700 backdrop-blur-sm">
              <Package className="w-3.5 h-3.5 text-[#EFEAE6]" />
              <span>{activeSlide.badge || 'INTRODUCING MODENA'}</span>
            </div>

            {/* Headline */}
            <h1
              onClick={(e) => {
                e.stopPropagation();
                handleSelectProduct(activeSlide.rawProduct || activeSlide);
              }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight uppercase leading-[1.15] text-white font-display-lg transition-all duration-700 pointer-events-auto cursor-pointer hover:text-gray-200 line-clamp-2 drop-shadow-md"
            >
              {activeSlide.name}
            </h1>

            {/* Subheading / Tagline */}
            {activeSlide.short_description && (
              <p className="text-xs sm:text-sm lg:text-[15px] text-gray-300 font-normal leading-relaxed max-w-md transition-all duration-700 line-clamp-2 drop-shadow">
                {activeSlide.short_description}
              </p>
            )}

            {/* CTA Button */}
            <div className="pt-2 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectProduct(activeSlide.rawProduct || activeSlide);
                }}
                className="bg-[#E60000] hover:bg-red-700 transition-all duration-300 text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-full flex items-center gap-2.5 cursor-pointer uppercase tracking-widest shadow-lg shadow-red-950/50 border border-red-500/20"
              >
                <span>{activeSlide.ctaText || 'SHOP BESTSELLER NOW'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pagination Dots (Bottom Left) */}
          {slides.length > 1 && (
            <div className="absolute bottom-5 left-8 lg:left-16 z-30 flex items-center gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    idx === currentIndex ? 'w-6 bg-[#E60000]' : 'w-1.5 bg-gray-500/60 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows (Bottom Right) */}
          {slides.length > 1 && (
            <div className="absolute bottom-5 right-8 lg:right-16 z-30 flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous Hero Product"
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 border border-white/20"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next Hero Product"
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 border border-white/20"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HeroBanner;
