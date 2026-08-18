import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const SiteReviewsSlider = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/wp-json/modena/v1/site-reviews');
      if (!res.ok) throw new Error('Failed to fetch site reviews');
      const data = await res.json();
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching site reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    window.addEventListener('modena_reviews_updated', fetchReviews);
    return () => window.removeEventListener('modena_reviews_updated', fetchReviews);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-pulse flex gap-4 overflow-hidden">
        {[1, 2, 3].map((n) => (
          <div key={n} className="w-[300px] h-[160px] bg-gray-200 rounded-2xl shrink-0" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
          <p className="text-gray-500 font-medium text-sm">No reviews yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 relative group">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display-md tracking-tight">Customer Reviews</h3>
          <p className="text-xs text-gray-500 font-medium mt-1">Recent feedback and ratings from buyers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="Previous Reviews"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="Next Reviews"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 pt-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reviews.map((review) => (
          <div
            key={review.id}
            className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 text-sm font-medium italic leading-relaxed line-clamp-4 mb-4">
                "{review.content}"
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto flex items-center gap-3">
              {review.product_image && review.product_image.trim() !== '' ? (
                <img src={review.product_image} alt={review.product_name || 'Product'} className="w-10 h-10 rounded-full object-cover bg-gray-50 border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg">
                  {(review.author || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="font-bold text-xs text-gray-900 block truncate">— {review.author}</span>
                <span className="text-[10px] text-gray-500 block truncate" title={review.product_name}>{review.product_name || 'Verified Buyer'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
};

export default SiteReviewsSlider;
