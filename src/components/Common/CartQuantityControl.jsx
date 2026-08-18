import React from 'react';
import { Plus, Minus } from 'lucide-react';

/**
 * Universal Cart Quantity Controller
 * Transforms [Add to Cart] into [ - ] [ quantity ] [ + ]
 * Reads strictly from the single source of truth (cart state).
 */
export default function CartQuantityControl({
  product,
  cart = [],
  onAddToCart,
  onUpdateQuantity,
  className = '',
  buttonClassName = '',
  controlClassName = '',
  size = 'md', // 'sm' | 'md' | 'full' | 'icon'
  buttonText = 'Add to Cart',
  showIcon = true,
  theme = 'red' // 'red' | 'dark'
}) {
  if (!product) return null;

  const isOut =
    product.isOutOfStock ||
    product.stock === 'Out of Stock' ||
    product.is_in_stock === false ||
    (product.categories || []).some(
      (c) => c.slug === 'out-of-stock' || (c.name || '').toLowerCase() === 'out of stock'
    );

  if (isOut) {
    return (
      <button
        type="button"
        disabled
        className="bg-gray-200 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed border border-gray-300 flex items-center gap-1.5 opacity-80 shrink-0 select-none"
      >
        <span>OUT OF STOCK</span>
      </button>
    );
  }

  const cartItem = (cart || []).find((item) => String(item.id) === String(product.id));
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e) => {
    e?.stopPropagation?.();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleIncrement = (e) => {
    e?.stopPropagation?.();
    if (onUpdateQuantity) {
      onUpdateQuantity(product.id, 1);
    } else if (onAddToCart) {
      onAddToCart(product, 1);
    }
  };

  const handleDecrement = (e) => {
    e?.stopPropagation?.();
    if (onUpdateQuantity) {
      onUpdateQuantity(product.id, -1);
    } else if (onAddToCart) {
      onAddToCart(product, -1);
    }
  };

  const baseBg = theme === 'dark' ? 'bg-[#292725] hover:bg-[#1E1C1A]' : 'bg-[#C91F26] hover:bg-[#A9181E]';
  const controlBg = theme === 'dark' ? 'bg-[#292725]' : 'bg-[#C91F26]';

  // 1. Initial State: NOT in cart
  if (quantity <= 0) {
    if (size === 'icon') {
      return (
        <button
          type="button"
          onClick={handleAdd}
          className={`p-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-white shadow-xs ${baseBg} ${buttonClassName}`}
          title={buttonText || 'Add to Cart'}
          aria-label={buttonText || 'Add to Cart'}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      );
    }

    if (size === 'full') {
      return (
        <button
          type="button"
          onClick={handleAdd}
          className={`w-full py-2.5 px-4 rounded-xl font-headline-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 text-white hover:shadow-md transition-all duration-150 cursor-pointer ${baseBg} ${buttonClassName}`}
        >
          {showIcon && <Plus className="w-4 h-4 stroke-[2.5]" />}
          <span>{buttonText}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleAdd}
        className={`text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 hover:shadow-md select-none ${baseBg} ${buttonClassName}`}
      >
        {showIcon && <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
        <span>{buttonText}</span>
      </button>
    );
  }

  // 2. Active State: In Cart -> [ - ] [ quantity ] [ + ]
  if (size === 'icon' || size === 'sm') {
    return (
      <div
        className={`flex items-center text-white rounded-xl overflow-hidden shadow-xs h-[34px] shrink-0 transition-all duration-150 select-none ${controlBg} ${controlClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDecrement}
          className="px-2 h-full hover:bg-black/20 active:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Decrease quantity"
          title="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <span className="px-1.5 font-bold text-xs min-w-[20px] text-center select-none" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="px-2 h-full hover:bg-black/20 active:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Increase quantity"
          title="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  if (size === 'full') {
    return (
      <div
        className={`w-full h-[38px] flex items-center justify-between text-white rounded-xl overflow-hidden shadow-xs transition-all duration-150 select-none ${controlBg} ${controlClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDecrement}
          className="w-10 h-full hover:bg-black/20 active:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Decrease quantity"
          title="Decrease quantity"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>
        <span className="font-bold text-xs tracking-wider select-none px-2" aria-live="polite">
          {quantity} IN CART
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-10 h-full hover:bg-black/20 active:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Increase quantity"
          title="Increase quantity"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  // Standard medium size
  return (
    <div
      className={`flex items-center text-white rounded-xl overflow-hidden shadow-sm shrink-0 h-[38px] transition-all duration-150 select-none ${controlBg} ${controlClassName}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleDecrement}
        className="px-2.5 h-full hover:bg-black/20 active:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Decrease quantity"
        title="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
      <span className="px-2 font-bold text-xs min-w-[22px] text-center select-none" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        className="px-2.5 h-full hover:bg-black/20 active:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Increase quantity"
        title="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
