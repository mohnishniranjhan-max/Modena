import React from 'react';
import { X, Award, ShoppingBag } from 'lucide-react';

/**
 * Interactive Side-by-Side Product Comparison Component
 */
export default function CompareModal({ items, onClose, onAddToCart }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#2A2724] space-y-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#E60000] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-inter">Compare Products Side-by-Side</h3>
            <p className="text-xs text-gray-500">Technical specifications and performance comparison</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-full h-44 bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center border border-gray-200">
                  {item.image && item.image.trim() !== '' ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  ) : null}
                </div>

                <span className="text-[10px] font-bold bg-[#E60000] text-white px-2 py-0.5 rounded shadow">
                  {item.badge || 'MODENA CRAFT'}
                </span>

                <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h4>
                <span className="text-lg font-bold text-[#E60000] block">{item.price_html || item.dealPrice || `₹${item.price}`}</span>
              </div>

              {/* Specifications List */}
              <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>Material:</span>
                  <strong className="text-gray-900 font-semibold">{item.material || ((item.name || '').toLowerCase().includes('cast iron') ? 'Organic Cast Iron' : (item.name || '').toLowerCase().includes('triply') || (item.name || '').toLowerCase().includes('stainless') || (item.name || '').toLowerCase().includes('steel') ? '3-Ply Stainless Steel' : (item.name || '').toLowerCase().includes('knife') ? 'German DIN 1.4116 Steel' : 'Food-Grade Materials')}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Rating:</span>
                  <strong className="text-amber-600 font-bold">{item.hasReviews || item.rating_count > 0 ? `★ ${Number(item.average_rating || 0).toFixed(1)} (${item.rating_count})` : 'No reviews'}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Warranty:</span>
                  <strong className="text-emerald-700 font-bold">Lifetime / 2-Year</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Dishwasher Safe:</span>
                  <strong className="text-gray-900 font-semibold">{item.id === 26 ? 'No (Appliance)' : 'Yes (Handwash Preferred)'}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  onAddToCart(item);
                  onClose();
                }}
                className="w-full bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ADD TO CART</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
