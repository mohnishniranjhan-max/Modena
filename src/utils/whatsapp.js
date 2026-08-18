export const WHATSAPP_NUMBER = '919326641825';
export const DEFAULT_MESSAGE = 'Hello Modena Team, I would like to inquire about your kitchenware products.';

/**
 * Opens WhatsApp native application directly using the whatsapp:// protocol scheme.
 * On mobile and desktop platforms with WhatsApp installed, this opens the WhatsApp app directly
 * without loading WhatsApp Web or intermediate redirect pages first.
 * If app launch is not supported, gracefully falls back to wa.me URL.
 */
export const openWhatsAppDirect = (phone = WHATSAPP_NUMBER, text = DEFAULT_MESSAGE, e = null) => {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const encodedText = text ? encodeURIComponent(text) : '';
  
  const nativeUrl = `whatsapp://send?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ''}`;
  const webUrl = `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;

  let appOpened = false;

  const handleBlur = () => {
    appOpened = true;
  };

  window.addEventListener('blur', handleBlur, { once: true });

  // Direct protocol launch
  window.location.href = nativeUrl;

  // Fallback to web if browser focus is retained after timeout
  setTimeout(() => {
    window.removeEventListener('blur', handleBlur);
    if (!appOpened && document.hasFocus()) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1500);
};
