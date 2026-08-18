/**
 * Modena Unified E-Commerce Tracking Utility
 * Handles dual-dispatch for Meta Pixel (Browser) & Server-Side Conversions API (CAPI)
 * with strict event_id deduplication.
 */

// Helper to generate unique event ID
export const generateEventId = (eventName) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `evt_${eventName.toLowerCase()}_${timestamp}_${random}`;
};

/**
 * Dispatch tracking event to Meta Pixel (Browser) & CAPI (Server)
 * @param {string} eventName - e.g. 'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'
 * @param {Object} customData - Product / Order data (content_ids, value, currency, etc.)
 * @param {Object} userData - Customer data (email, phone, first_name, last_name)
 */
export const trackEvent = async (eventName, customData = {}, userData = {}) => {
  const eventId = generateEventId(eventName);

  // 1. Browser Meta Pixel Dispatch (Deduplicated with eventID)
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch (err) {
      console.warn('[Analytics] Pixel dispatch warning:', err);
    }
  }

  // 2. Server-Side Conversions API (CAPI) REST Dispatch
  try {
    fetch('/wp-json/modena/v1/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        custom_data: customData,
        user_data: userData
      })
    }).catch((err) => {
      console.warn('[Analytics] CAPI REST warning:', err);
    });
  } catch (err) {
    console.warn('[Analytics] CAPI fetch error:', err);
  }
};

/**
 * Helper Shortcuts
 */
export const trackPageView = () => trackEvent('PageView');

export const trackViewContent = (product) => {
  if (!product) return;
  trackEvent('ViewContent', {
    content_name: product.name || product.title,
    content_category: product.category || 'Cookware',
    content_ids: [String(product.id || product.sku)],
    content_type: 'product',
    value: parseFloat(product.price || 0),
    currency: 'INR'
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  trackEvent('AddToCart', {
    content_name: product.name || product.title,
    content_ids: [String(product.id || product.sku)],
    content_type: 'product',
    value: parseFloat(product.price || 0) * quantity,
    currency: 'INR',
    num_items: quantity
  });
};

export const trackInitiateCheckout = (cartItems = [], totalAmount = 0) => {
  trackEvent('InitiateCheckout', {
    content_ids: cartItems.map((item) => String(item.id || item.sku)),
    content_type: 'product',
    value: parseFloat(totalAmount),
    currency: 'INR',
    num_items: cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
  });
};

export const trackPurchase = (orderId, totalAmount = 0, cartItems = [], customerInfo = {}) => {
  trackEvent(
    'Purchase',
    {
      content_ids: cartItems.map((item) => String(item.id || item.sku)),
      content_type: 'product',
      value: parseFloat(totalAmount),
      currency: 'INR',
      num_items: cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0),
      order_id: String(orderId)
    },
    {
      email: customerInfo.email || '',
      phone: customerInfo.phone || '',
      first_name: customerInfo.firstName || '',
      last_name: customerInfo.lastName || ''
    }
  );
};
