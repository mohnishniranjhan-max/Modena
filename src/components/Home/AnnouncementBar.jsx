import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, Package, RotateCcw } from 'lucide-react';
import { openWhatsAppDirect } from '../../utils/whatsapp';

const announcements = [
  "7-Day Return Policy • Free Shipping Above ₹2,999",
  "Dispatched Within 1 Business Day • 3–7 Days Delivery Across India",
  "5-Year Motor Warranty On Mixer Grinders • 2-Year On Blenders",
  "100% Secure Prepaid Payments • Refunds Processed in 5–7 Days",
  "Order Cancellation Allowed Within 2 Hours of Purchase"
];

const AnnouncementBar = ({ onOrders, onReturns }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 relative z-50">
      <div className="bg-[#C91F26] text-white text-xs sm:text-[13px] font-medium py-2 px-6 sm:px-10 rounded-b-[24px] sm:rounded-b-[28px] shadow-sm flex items-center justify-between select-none border-b border-red-700/40">
        {/* Left Side: Carousel message with arrows */}
        <div className="flex items-center gap-2 mx-auto md:mx-0">
          <button
            onClick={handlePrev}
            aria-label="Previous Announcement"
            className="hover:opacity-80 transition-opacity cursor-pointer p-0.5 flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <span className="font-semibold tracking-wide text-center min-w-[260px] sm:min-w-[320px] transition-all duration-300">
            {announcements[index]}
          </span>
          <button
            onClick={handleNext}
            aria-label="Next Announcement"
            className="hover:opacity-80 transition-opacity cursor-pointer p-0.5 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Side: +91 93266 41825, Orders, Returns */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-[12px] lg:text-[12.5px] font-semibold tracking-wide">
          <a
            href="whatsapp://send?phone=919326641825"
            onClick={(e) => openWhatsAppDirect('919326641825', '', e)}
            className="flex items-center gap-1.5 hover:text-red-100 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>+91 93266 41825</span>
          </a>
          <button
            onClick={onOrders}
            className="flex items-center gap-1.5 hover:text-red-100 transition-colors cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders</span>
          </button>
          <button
            onClick={onReturns}
            className="flex items-center gap-1.5 hover:text-red-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returns</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
