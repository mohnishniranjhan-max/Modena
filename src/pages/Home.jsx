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
  Layers,
  BookOpen,
  ChefHat,
  Clock
} from 'lucide-react';
import { getStoredReviews, getProductRatingData, sortProductsByRating } from '../hooks/useProducts';
import HeroBanner from '../components/Home/HeroBanner';
import SiteReviewsSlider from '../components/Home/SiteReviewsSlider';
import RecipesSection from '../components/Recipes/RecipesSection';
import CartQuantityControl from '../components/Common/CartQuantityControl';

const Home = ({
  bestsellers = [],
  allProducts = [],
  isProductsLoading = false,
  selectedProduct,
  setSelectedProduct,
  setProductQuantity,
  handleAddToCart,
  cart = [],
  updateQuantity,
  wishlist = [],
  toggleWishlist,
  isWishlisted,
  setCurrentView,
  onSelectRecipe
}) => {
  const [dbReviews, setDbReviews] = useState(() => getStoredReviews());

  useEffect(() => {
    const updateReviews = () => setDbReviews(getStoredReviews());
    window.addEventListener('modena_reviews_updated', updateReviews);
    return () => window.removeEventListener('modena_reviews_updated', updateReviews);
  }, []);

  // Helper to filter allProducts by keywords with smart fallback
  const getCategoryProducts = (keywords) => {
    if (!allProducts || allProducts.length === 0) return [];
    return allProducts.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const pCats = (p.categories || []).map((c) => ((c.name || '') + ' ' + (c.slug || '')).toLowerCase()).join(' ');
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.desc || p.description || '').toLowerCase();

      return keywords.some((kw) => pCat.includes(kw) || pCats.includes(kw) || pName.includes(kw) || pDesc.includes(kw));
    });
  };

  const mixerProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return allProducts.filter((p) => {
      const pCats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase());
      const pName = (p.name || '').toLowerCase();
      const isAccessory = pCats.includes('accessories');
      const isMixer = pCats.includes('mixer-grinder') || pCats.includes('mixer') || pName.includes('mixer grinder');
      return isMixer && !isAccessory;
    });
  }, [allProducts]);

  const accessoryProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return allProducts.filter((p) => {
      const pCats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase());
      return pCats.includes('accessories');
    });
  }, [allProducts]);

  const nutrimixProducts = useMemo(() => {
    const matched = getCategoryProducts(['nutrimix', 'nutri-blend']);
    return matched.length > 0 ? matched : (allProducts || []).slice(1, 5);
  }, [allProducts]);

  const cookwareProducts = useMemo(() => {
    const matched = getCategoryProducts(['cookware']);
    return matched.length > 0 ? matched : (allProducts || []).slice(2, 6);
  }, [allProducts]);



  // Helper for rendering product card grid items
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

    const ratingData = getProductRatingData(item);
    const hasRating = ratingData.hasReviews;
    const ratingVal = ratingData.averageRating;
    const ratingCount = ratingData.ratingCount;

    return (
      <div
        key={item.id}
        className={`bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300 transition-all group relative overflow-hidden ${
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

          {/* Rating */}
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

          {/* Title & Desc */}
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
            {item.desc || item.description || 'Modena culinary product engineered for high performance and longevity.'}
          </p>
        </div>

        {/* Footer Price & CTA */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-[#2A2724]">{item.price}</span>
            {item.originalPrice && (
              <span className="text-xs text-gray-400 line-through font-medium">{item.originalPrice}</span>
            )}
          </div>
          <CartQuantityControl
            product={{
              id: item.id,
              name: item.name,
              price: item.numericPrice || item.price,
              price_html: item.price,
              image: item.image,
              isOutOfStock: isOut,
              stock: item.stock,
              categories: item.categories
            }}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={updateQuantity}
            buttonText="ADD TO CART"
            buttonClassName="bg-[#E60000] hover:bg-red-800"
            controlClassName="bg-[#E60000]"
          />
        </div>
      </div>
    );
  };

  // Generic Reusable Category Showcase Component
  const renderCategorySection = ({
    id,
    badge,
    title,
    subtitle,
    categorySlug,
    products,
    bgClass = 'bg-white',
    icon: IconComp
  }) => {
    return (
      <section id={`section-${id}`} className={`py-12 sm:py-16 ${bgClass}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2A2724] tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={() => setCurrentView && setCurrentView(categorySlug)}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#E60000] hover:text-red-800 transition-colors uppercase tracking-wider self-start sm:self-auto cursor-pointer group"
            >
              <span>Explore {title}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Grid */}
          {isProductsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[380px] bg-gray-200 animate-pulse rounded-2xl border border-gray-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm font-semibold bg-gray-50 rounded-2xl border border-gray-200">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((item) => renderProductCard(item, title.toUpperCase()))}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="bg-[#EFEAE6] text-[#2A2724] min-h-screen">

      {/* 2. HERO BANNER */}
      <div className="pt-2 sm:pt-4">
        <HeroBanner
          categoryId="hero-banner"
          onSelectProduct={(product) => {
            if (setSelectedProduct) setSelectedProduct(product);
            if (setProductQuantity) setProductQuantity(1);
          }}
        />
      </div>

      <SiteReviewsSlider />

      {/* 3. MIXER GRINDER SECTION */}
      {renderCategorySection({
        id: 'mixer-grinder',
        badge: 'COMMERCIAL & HEAVY DUTY',
        title: 'Mixer Grinders',
        subtitle: 'Engineered with heavy-duty high-torque motors and food-grade stainless steel jars.',
        categorySlug: 'mixer-grinder',
        products: mixerProducts,
        bgClass: 'bg-[#FAF8F6]',
        icon: Zap
      })}

      {/* 3.5. ACCESSORIES SECTION */}
      {accessoryProducts.length > 0 && renderCategorySection({
        id: 'accessories',
        badge: 'GENUINE ACCESSORIES',
        title: 'Accessories',
        subtitle: 'Food-grade stainless steel jar sets, polycarbonate lids, and replacement attachments.',
        categorySlug: 'mixer-grinder',
        products: accessoryProducts,
        bgClass: 'bg-white',
        icon: Layers
      })}

      {/* 4. NUTRIMIX SECTION */}
      {renderCategorySection({
        id: 'nutrimix',
        badge: 'NUTRIENT EXTRACTORS',
        title: 'Nutrimix',
        subtitle: 'High-speed nutrient blenders designed for smoothies, protein shakes, and superfoods.',
        categorySlug: 'nutrimix',
        products: nutrimixProducts,
        bgClass: 'bg-white',
        icon: Sparkles
      })}

      {/* 5. COOKWARE SECTION */}
      {renderCategorySection({
        id: 'cookware',
        badge: 'HERITAGE COOKWARE',
        title: 'Cookware',
        subtitle: 'Premium tri-ply stainless steel & seasoned cast iron pans built for lifetime cooking.',
        categorySlug: 'cookware',
        products: cookwareProducts,
        bgClass: 'bg-[#FAF8F6]',
        icon: CookingPot
      })}



      {/* 7. DYNAMIC RECIPES & COOKING GUIDES COMPONENT */}
      <RecipesSection
        onSelectRecipe={onSelectRecipe}
        onExploreRecipes={() => {
          if (setCurrentView) setCurrentView('recipes');
          window.location.hash = 'recipes';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
};

export default Home;
