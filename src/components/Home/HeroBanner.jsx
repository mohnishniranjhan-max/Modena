import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { decodeHtmlEntities, normalizeProduct } from '../../hooks/useProducts';

/**
 * HeroBanner Component
 * Data-driven Hero Banner that strictly fetches products from the WooCommerce 'hero-banner' category.
 * Desktop Layout: Details on left, 4:3 image with seamless fade mask emerging on the right.
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
    const fetchHeroProducts = async () => {
      setIsLoading(true);
      try {
        const url = `/wp-json/wc/store/v1/products?per_page=100&timestamp=${new Date().getTime()}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const heroProducts = data.filter((item) => {
              if (!Array.isArray(item.categories)) return false;
              return item.categories.some(
                (c) =>
                  c.slug === 'hero-banner' ||
                  c.name?.toLowerCase() === 'hero banner' ||
                  c.name?.toLowerCase() === 'herobanner' ||
                  String(c.id) === String(categoryId)
              );
            });

            if (heroProducts.length > 0) {
              const mappedSlides = heroProducts.map((item) => {
                const normalized = normalizeProduct(item);
                return {
                  id: normalized.id,
                  name: (normalized.name || 'MODENA CULINARY PRODUCT').toUpperCase(),
                  short_description: normalized.desc || normalized.description || '',
                  image: normalized.image,
                  price: normalized.price_html || normalized.price || null,
                  rawProduct: normalized,
                  badge: 'INTRODUCING MODENA',
                  ctaText: 'Shop Bestseller Now'
                };
              });

              if (isMounted) {
                setSlides(mappedSlides);
                setIsLoading(false);
              }
              return;
            }
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

    fetchHeroProducts();

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

  // 1. Loading Skeleton View
  if (isLoading) {
    return (
      <div className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 pt-2 pb-2">
        {/* Mobile Skeleton */}
        <div className="sm:hidden relative w-full rounded-[28px] overflow-hidden bg-[#2A2724] border border-white/10 shadow-2xl animate-pulse">
          <div className="h-56 bg-stone-900/60" />
          <div className="p-5 space-y-3">
            <div className="w-28 h-5 bg-red-950/60 rounded-full" />
            <div className="w-3/4 h-8 bg-stone-800/80 rounded-xl" />
            <div className="w-full h-10 bg-stone-800/50 rounded-lg" />
            <div className="w-full h-11 bg-[#E60000]/40 rounded-2xl" />
          </div>
        </div>
        {/* Desktop Skeleton */}
        <div className="hidden sm:flex relative w-full h-[540px] lg:h-[580px] rounded-[36px] overflow-hidden bg-[#2A2724] border border-white/10 shadow-2xl items-center p-12">
          <div className="w-full lg:w-1/2 space-y-5">
            <div className="w-40 h-7 bg-red-950/60 rounded-full border border-red-900/40" />
            <div className="w-3/4 h-12 sm:h-16 bg-stone-800/80 rounded-xl" />
            <div className="w-full h-12 bg-stone-800/50 rounded-lg" />
            <div className="w-48 h-12 bg-[#E60000]/40 rounded-full" />
          </div>
          <div className="hidden lg:block lg:w-1/2 h-full bg-stone-900/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 2. No Products State
  if (slides.length === 0) {
    return (
      <div className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 pt-2 pb-2">
        <div className="relative w-full h-[360px] sm:h-[460px] rounded-[36px] overflow-hidden bg-gradient-to-r from-[#2A2724] via-[#2A2724] to-[#2A2724] border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E60000]/20 border border-[#E60000]/40 flex items-center justify-center text-[#EFEAE6] mb-1">
            <Sparkles className="w-6 h-6 text-[#EFEAE6]" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white uppercase tracking-tight font-display-lg">
            no hero product
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md leading-relaxed">
            No products are currently assigned to the <code className="bg-white/10 px-2 py-0.5 rounded text-amber-300 font-mono">hero-banner</code> category in WooCommerce.
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

        {/* Full-Bleed Product Image â€” Top Half (clickable, no zoom button) */}
        <div className="relative w-full h-[220px] overflow-hidden">
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
        <div className="relative w-full h-[540px] lg:h-[600px] rounded-[36px] overflow-hidden bg-gradient-to-r from-[#171413] to-[#201514] shadow-2xl border border-white/10 group flex items-center justify-between px-12 lg:px-16">

          {/* BACKGROUND SLIDES: Right Photo with Red Glow */}
          {slides.map((slide, index) => (
            <div
              key={slide.id || index}
              onClick={() => handleSelectProduct(slide.rawProduct || slide)}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${
                index === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Red Glow Behind Image */}
              <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] rounded-full bg-[#E60000]/10 border border-[#E60000]/30 shadow-[0_0_120px_60px_rgba(230,0,0,0.15)] pointer-events-none" />

              {slide.image && (
                <div className="absolute top-0 right-0 w-full lg:w-[55%] h-full z-10 flex items-center justify-center p-8">
                  <img
                    src={slide.image}
                    alt={slide.name}
                    className={`w-full h-full object-contain object-center lg:object-right transition-transform duration-[6000ms] ease-out select-none drop-shadow-2xl ${
                      index === currentIndex ? 'scale-105' : 'scale-100'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}

          {/* LEFT COLUMN: Animated Product Details & CTA */}
          <div className="relative z-20 w-full lg:w-[50%] flex flex-col justify-center space-y-4 sm:space-y-5 text-left pointer-events-none pl-4 lg:pl-8">
            {/* Top Badge / Intro Text */}
            <div className="self-start inline-flex items-center gap-2 bg-[#2A1616] text-[#EFEAE6] border border-[#E60000]/20 text-[10px] lg:text-[11px] font-bold px-3 lg:px-4 py-1.5 rounded-full uppercase tracking-widest transition-all duration-700">
              <Package className="w-3.5 h-3.5 text-[#EFEAE6]" />
              <span>{activeSlide.badge || 'INTRODUCING MODENA'}</span>
            </div>

            {/* Headline */}
            <h1
              onClick={(e) => {
                e.stopPropagation();
                handleSelectProduct(activeSlide.rawProduct || activeSlide);
              }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-medium tracking-tight uppercase leading-[1.1] text-white font-display-lg transition-all duration-700 pointer-events-auto cursor-pointer hover:text-gray-200"
            >
              {activeSlide.name}
            </h1>

            {/* Subheading / Tagline */}
            {activeSlide.short_description && (
              <p className="text-sm sm:text-base lg:text-lg text-gray-400 font-normal leading-relaxed max-w-xl transition-all duration-700 pt-2">
                {activeSlide.short_description}
              </p>
            )}

            {/* CTA Button */}
            <div className="pt-6 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectProduct(activeSlide.rawProduct || activeSlide);
                }}
                className="bg-[#E60000] hover:bg-red-800 transition-all duration-300 text-white font-bold text-sm px-8 py-3.5 rounded-full flex items-center gap-3 cursor-pointer uppercase tracking-widest shadow-lg shadow-[#E60000]/20"
              >
                <span>{activeSlide.ctaText || 'Shop Bestseller Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pagination Dots (Bottom Left) */}
          {slides.length > 1 && (
            <div className="absolute bottom-10 left-12 lg:left-24 z-30 flex items-center gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                    idx === currentIndex ? 'w-6 bg-[#E60000]' : 'w-2 bg-gray-500 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows (Bottom Right) */}
          {slides.length > 1 && (
            <div className="absolute bottom-10 right-12 lg:right-16 z-30 flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous Hero Product"
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next Hero Product"
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HeroBanner;
