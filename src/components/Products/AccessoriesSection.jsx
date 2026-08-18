import React from 'react';
import { Truck, Star, Heart, Zap, Check, Layers } from 'lucide-react';
import CartQuantityControl from '../Common/CartQuantityControl';

const AccessoriesSection = ({
  accessories = [],
  onAddToCart,
  onUpdateQuantity,
  cart = [],
  onSelectProduct,
  wishlist = [],
  onToggleWishlist,
  addingId,
  addedId
}) => {
  if (!accessories || accessories.length === 0) return null;

  const renderProductPrice = (product) => {
    const rawPrice = product.price || product.prices?.price || 0;
    const formattedPrice =
      product.price_html ||
      (typeof rawPrice === 'number'
        ? `₹${rawPrice.toLocaleString('en-IN')}`
        : rawPrice.startsWith('₹')
        ? rawPrice
        : `₹${rawPrice}`);

    const regularPrice =
      product.regular_price ||
      (typeof rawPrice === 'number'
        ? `₹${Math.round(rawPrice * 1.45).toLocaleString('en-IN')}`
        : '');

    return (
      <div className="flex items-baseline gap-2">
        <span className="text-base sm:text-lg font-bold text-[#C91F26]">
          {formattedPrice}
        </span>
        {regularPrice && (
          <span className="text-xs text-[#716D67] line-through font-medium">
            {regularPrice}
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="mt-14 pt-10 border-t border-[#D8D4CD] w-full">
      {/* Component Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#C91F26] text-[11px] font-bold tracking-wider uppercase mb-2 border border-red-200">
            <Layers className="w-3.5 h-3.5" />
            <span>GENUINE ACCESSORIES</span>
          </div>
          <h2 className="font-display-lg text-2xl sm:text-3xl font-extrabold text-[#292725] tracking-tight">
            Accessories
          </h2>
          <p className="text-xs sm:text-sm text-[#716D67] mt-1">
            Food-grade stainless steel jar sets, polycarbonate lids, and replacement attachments.
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="physics-container w-full">
        <div className="grid grid-cols-1 @[700px]:grid-cols-2 @[1100px]:grid-cols-3 gap-6">
          {accessories.map((product) => {
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

            return (
              <div
                key={product.id}
                className={`group bg-[#F8F7F4] rounded-2xl border border-[#D8D4CD] p-4 sm:p-5 flex flex-col sm:flex-row @[700px]:flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${
                  isOut ? 'opacity-75 grayscale-[25%]' : ''
                }`}
              >
                {/* Left Side (Image & Badging) */}
                <div
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                  className="w-full sm:w-52 @[700px]:w-full aspect-[4/3] bg-[#F3F1ED] rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center p-2.5 transition-all duration-300 cursor-pointer border border-[#EAE7E1]"
                >
                  {/* Out of Stock Badge */}
                  {isOut && (
                    <div className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider flex items-center gap-1 bg-stone-800">
                      <span>OUT OF STOCK</span>
                    </div>
                  )}

                  {/* Wishlist Button Overlay */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist && onToggleWishlist(product);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-[#F8F7F4]/90 backdrop-blur-md border border-[#D8D4CD] flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-[#C91F26] text-[#C91F26]' : 'text-[#716D67] hover:text-[#C91F26]'}`} />
                  </button>

                  {isOut && <div className="absolute inset-0 bg-stone-900/10 pointer-events-none rounded-xl" />}
                  {imageSrc && imageSrc.trim() !== '' ? (
                    <img
                      src={imageSrc}
                      alt={imageAlt || product.name || 'Accessory Image'}
                      className="w-full h-full object-contain rounded transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>

                {/* Right Side (Product Info & Specs) */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    {/* Free Delivery Tag */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isOut && (
                        <span className="text-[9px] font-extrabold bg-stone-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          OUT OF STOCK
                        </span>
                      )}
                      <span className="text-[9.5px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                        <Truck className="w-3 h-3 text-emerald-700" /> FREE Delivery in 3-7 Days
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                      className="font-headline-md text-sm sm:text-base font-bold text-[#292725] tracking-tight group-hover:text-[#C91F26] transition-colors mb-1 cursor-pointer line-clamp-2"
                    >
                      {product.name}
                    </h3>

                    {/* Ratings Row */}
                    {(() => {
                      const parsedAvg = parseFloat(product.average_rating || product.rating);
                      const parsedCount = parseInt(product.rating_count || product.review_count, 10);
                      const hasRealReviews = !isNaN(parsedAvg) && parsedAvg > 0 && !isNaN(parsedCount) && parsedCount > 0;

                      if (hasRealReviews) {
                        return (
                          <div className="flex items-center gap-1.5 mb-2 text-xs">
                            <span className="font-bold text-amber-800 bg-amber-50/80 px-1.5 py-0.2 rounded border border-amber-200 text-[11px] flex items-center gap-0.5">
                              {parsedAvg.toFixed(1)} <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            </span>
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.round(parsedAvg) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[#716D67] text-[11px] font-medium">
                              ({parsedCount} {parsedCount === 1 ? 'Review' : 'Reviews'})
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center gap-1.5 mb-2 text-xs">
                          <span className="text-xs font-semibold text-[#716D67] bg-[#EAE7E1] px-1.5 py-0.5 rounded">
                            No reviews
                          </span>
                        </div>
                      );
                    })()}

                    {/* Pricing */}
                    <div className="mb-2">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {renderProductPrice(product)}
                        <span className="text-[10px] font-extrabold bg-[#EAE7E1] text-[#C91F26] border border-[#D8D4CD] px-2 py-0.5 rounded">
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
                  <div className="pt-2.5 border-t border-[#D8D4CD]/60 flex flex-col sm:flex-row @[700px]:flex-col items-start sm:items-center @[700px]:items-stretch justify-between gap-2.5">
                    {isOut ? (
                      <span className="text-[10.5px] text-gray-500 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span>Currently Out of Stock.</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-[#C91F26] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C91F26] animate-pulse" />
                        <span>In Stock</span>
                      </span>
                    )}

                    <CartQuantityControl
                      product={product}
                      cart={cart}
                      onAddToCart={onAddToCart}
                      onUpdateQuantity={onUpdateQuantity}
                      size="full"
                      buttonText="Add to Cart"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AccessoriesSection;
