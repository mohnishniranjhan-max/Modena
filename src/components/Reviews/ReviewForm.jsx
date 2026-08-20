import React, { useState } from 'react';
import { Star, CheckCircle2, Loader2, Award } from 'lucide-react';

/**
 * Interactive Customer Review & Rating Submission Component
 * Directly interacts with WooCommerce REST API (/wp-json/wc/v3/products/reviews)
 */
export default function ReviewForm({ product, user, isVerifiedPurchaser = false, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState(user?.displayName || user?.firstName || '');
  const [reviewerEmail, setReviewerEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setErrorMessage('Please enter your review text.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      product_id: product?.id || 26,
      review: reviewText.trim(),
      reviewer: reviewerName.trim() || 'Verified Customer',
      reviewer_email: reviewerEmail.trim() || 'customer@modenahome.store',
      rating: rating,
      verified: isVerifiedPurchaser
    };

    try {
      const token = localStorage.getItem('modena_jwt_token');
      const res = await fetch('/wp-json/modena/v1/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 201 || res.status === 200) {
        setSuccessMessage('Thank you! Your review has been submitted.');
        setReviewText('');
        if (onReviewSubmitted) onReviewSubmitted(payload);
        window.dispatchEvent(new Event('modena_reviews_updated'));
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.message || 'Could not submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-base text-[#2A2724] font-inter">Write a Customer Review</h3>
          <p className="text-xs text-gray-500">Share your experience with the {product?.name || 'Modena Culinary product'}</p>
        </div>
        {isVerifiedPurchaser && (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Purchaser</span>
          </span>
        )}
      </div>

      {successMessage ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interactive Star Rating Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Your Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        active ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-gray-600 ml-2">
                {rating === 5 ? '5.0 - Exceptional' : rating === 4 ? '4.0 - Very Good' : rating === 3 ? '3.0 - Average' : rating === 2 ? '2.0 - Below Average' : '1.0 - Poor'}
              </span>
            </div>
          </div>

          {/* Name & Email Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Email</label>
              <input
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000]"
              />
            </div>
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Written Review</label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you love about this product? How does it perform in your kitchen?"
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3.5 text-xs focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000]"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-bold">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SUBMITTING REVIEW...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>SUBMIT VERIFIED REVIEW</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
