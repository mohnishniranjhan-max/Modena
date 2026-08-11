import React from 'react';

const WHATSAPP_NUMBER = '919326641825';
const DEFAULT_MESSAGE = 'Hello Modena Team, I would like to inquire about your kitchenware products.';

export default function WhatsAppWidget({ isCartOpen = false, isCheckoutOpen = false, isFooterInView = false }) {
  if (isCheckoutOpen) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div
      className={`fixed z-50 transition-all duration-500 ease-in-out flex items-center gap-2 ${
        isCartOpen
          ? 'hidden md:flex md:right-[440px] ' + (isFooterInView ? 'bottom-28 md:bottom-32' : 'bottom-6')
          : 'right-20 md:right-24 ' + (isFooterInView ? 'bottom-28 md:bottom-32' : 'bottom-4 md:bottom-6')
      }`}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Modena on WhatsApp (+91 93266 41825)"
        title="Chat with Modena on WhatsApp (+91 93266 41825)"
        className="group relative h-14 w-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/30 cursor-pointer text-decoration-none"
      >
        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 fill-current flex-shrink-0 transition-transform group-hover:rotate-12"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Online Indicator Badge */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white text-[8px] font-extrabold text-[#2A2724] items-center justify-center">
            ✓
          </span>
        </span>
      </a>
    </div>
  );
}
