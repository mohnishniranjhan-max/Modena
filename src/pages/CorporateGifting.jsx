import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Sparkles,
  ArrowDown,
  ShieldCheck,
  Package,
  Gift,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useProducts, normalizeProduct } from '../hooks/useProducts';
import { HeroFestiveAtmosphere, triggerButtonSparkles, WholePageShimmer } from '../components/CorporateGifting/FestiveSparkles';
import CartQuantityControl from '../components/Common/CartQuantityControl';

const CorporateGifting = ({
  setCurrentView,
  onSelectProduct,
  onAddToCart,
  onUpdateQuantity,
  cart = []
}) => {
  const { products, loading } = useProducts();
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  // Corporate Gifting Enquiry Form State
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    quantity: '',
    message: '',
    websiteUrl: '' // Anti-spam honeypot
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleProductAddToCart = (product) => {
    if (onAddToCart) {
      setAddingId(product.id);
      onAddToCart(product);
      setAddingId(null);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1800);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filter and normalize products belonging to Corporate Gifting category
  const giftingProducts = useMemo(() => {
    if (!products || !Array.isArray(products) || products.length === 0) return [];
    
    const filtered = products.filter((p) => {
      const cats = Array.isArray(p.categories) ? p.categories : [];
      return cats.some((c) => {
        const slug = (typeof c === 'string' ? c : c.slug || '').toLowerCase().trim();
        const name = (typeof c === 'string' ? c : c.name || '').toLowerCase().trim();
        return slug === 'corporate-gifting' || name === 'corporate gifting';
      });
    });

    const listToUse = filtered.length > 0 ? filtered : products.slice(0, 8);
    return listToUse.map((p) => normalizeProduct(p));
  }, [products]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName || !formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name.';
    }

    if (!formData.companyName || !formData.companyName.trim() || formData.companyName.trim().length < 2) {
      errors.companyName = 'Please enter your company / organization name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid work email address.';
    }

    const digitsOnly = (formData.phone || '').replace(/[^0-9]/g, '');
    if (!digitsOnly || digitsOnly.length < 7) {
      errors.phone = 'Please enter a valid phone number (min 7 digits).';
    }

    const qtyNumber = parseInt(formData.quantity, 10);
    if (!formData.quantity || isNaN(qtyNumber) || qtyNumber <= 0 || qtyNumber > 1000000) {
      errors.quantity = 'Please enter an estimated quantity (1 to 1,000,000 units).';
    }

    if (!formData.message || !formData.message.trim() || formData.message.trim().length < 5) {
      errors.message = 'Please provide details on your requirements or target delivery date.';
    }

    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Spam honeypot detection
    if (formData.websiteUrl && formData.websiteUrl.trim().length > 0) {
      setSubmitSuccess(true);
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/wp-json/modena/v1/corporate-gifting-enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          company_name: formData.companyName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          quantity: parseInt(formData.quantity, 10),
          message: formData.message.trim(),
          _hp_check: formData.websiteUrl || ''
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        setFormData({
          fullName: '',
          companyName: '',
          email: '',
          phone: '',
          quantity: '',
          message: '',
          websiteUrl: ''
        });
        setFormErrors({});
      } else {
        setSubmitError(data.message || 'Unable to submit enquiry. Please try again.');
      }
    } catch (err) {
      console.error('Corporate gifting enquiry error:', err);
      // Resilient offline fallback storage
      try {
        const stored = JSON.parse(localStorage.getItem('modena_gifting_enquiries_offline') || '[]');
        stored.push({
          ...formData,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('modena_gifting_enquiries_offline', JSON.stringify(stored));
        setSubmitSuccess(true);
      } catch {
        setSubmitError('Unable to submit enquiry right now. Please reach out directly on WhatsApp or Email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Real Modena product assets for the editorial hero showcase
  const primaryHeroProduct = giftingProducts[0] || null;
  const secondaryHeroProduct = giftingProducts[1] || giftingProducts[0] || null;

  const heroPrimaryImage = primaryHeroProduct?.image || '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';
  const heroSecondaryImage = secondaryHeroProduct?.image || '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';

  return (
    <div id="corporate-gifting" className="relative min-h-screen bg-[#FAF8F5] text-[#292725] font-inter overflow-hidden pb-16 selection:bg-[#C91F26] selection:text-white">
      {/* 0. SUBTLE WHOLE-PAGE AMBIENT SHIMMER */}
      <WholePageShimmer />

      {/* Main Page Container */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">

        {/* ========================================================================= */}
        {/* 1. HERO — MAJOR EDITORIAL REDESIGN */}
        {/* ========================================================================= */}
        <section className="relative rounded-[2.5rem] bg-gradient-to-br from-[#FFFFFF] via-[#FAF7F2] to-[#F5F0E6] border border-[#EAE3D7] shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 sm:p-12 lg:p-16 mb-20 sm:mb-28 overflow-hidden">
          {/* Subtle Ambient Sparkles & Golden Glow Layer */}
          <HeroFestiveAtmosphere />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Editorial Typography & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              
              {/* Refined Gold Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FAF6EE] via-[#F4EDE0] to-[#FAF6EE] border border-[#D4AF37]/40 text-[#8C5A24] text-[11px] font-bold tracking-widest uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]/30" />
                <span>BESPOKE CORPORATE &amp; FESTIVE GIFTING</span>
              </div>

              {/* Main Heading & Subtitle */}
              <div className="space-y-3">
                <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl font-bold text-[#292725] tracking-tight leading-[1.08]">
                  Corporate Gifting
                </h1>
                <p className="text-xl sm:text-2xl text-[#8C5A24] font-medium tracking-tight">
                  Elevate Your Corporate &amp; Festive Relationships
                </p>
              </div>

              {/* Editorial Description */}
              <p className="text-sm sm:text-base text-[#5E5953] leading-relaxed max-w-xl font-normal">
                Honor distinguished partners, celebrate organizational milestones, and delight clients with Modena's premium culinary collections. Handcrafted with zero chemical coatings, heavy-gauge food-grade materials, and bespoke custom inscribing.
              </p>

              {/* Distinct Luxury Value Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-2">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-[#EAE3D7] shadow-xs">
                  <Building2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#292725]">Custom Inscription</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-[#EAE3D7] shadow-xs">
                  <Gift className="w-4 h-4 text-[#C91F26] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#292725]">Luxury Packaging</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-[#EAE3D7] shadow-xs">
                  <Package className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#292725]">Direct Volume Pricing</span>
                </div>
              </div>

              {/* Action Buttons & Scroll Cue */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('enquiry-form')}
                  className="px-7 py-3.5 rounded-full bg-[#C91F26] hover:bg-[#A9181E] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-[#C91F26]/25 flex items-center gap-2 cursor-pointer"
                >
                  <span>Request Corporate Proposal</span>
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('recommended-products')}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-[#F3EFE9] text-[#292725] border border-[#D8D4CD] font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
                >
                  Explore Gifting Products
                </button>
              </div>

            </div>

            {/* Right Column: Layered Editorial Product Composition */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              
              {/* Soft Golden Halo background */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37]/15 via-[#C91F26]/5 to-transparent blur-2xl pointer-events-none transform scale-110"
              />

              {/* Decorative Showcase Display Frame */}
              <div className="relative w-full max-w-[420px] aspect-4/5 rounded-3xl bg-gradient-to-b from-white/95 to-[#F8F5EE]/90 p-5 sm:p-6 border border-[#EAE3D7] shadow-[0_15px_40px_rgba(0,0,0,0.06)] backdrop-blur-xs flex flex-col justify-between">
                
                {/* Floating Top Tag */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D7]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8C5A24] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>CURATED GIFTING SUITE</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#716D67] bg-[#EAE7E1] px-2 py-0.5 rounded-full">
                    Bulk Ready
                  </span>
                </div>

                {/* Layered Showcase Images */}
                <div className="relative my-auto py-4 flex items-center justify-center">
                  
                  {/* Secondary Product (Background Depth Layer) */}
                  <div className="absolute -right-2 -bottom-2 w-44 sm:w-52 aspect-square rounded-2xl bg-white p-3 border border-[#EAE3D7] shadow-md transform rotate-6 opacity-85 hover:rotate-3 transition-transform duration-500 overflow-hidden">
                    <img
                      src={heroSecondaryImage}
                      alt={secondaryHeroProduct?.name || 'Modena Cookware'}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Primary Hero Product (Foreground Focal Layer) */}
                  <div className="relative z-10 w-52 sm:w-60 aspect-square rounded-2xl bg-white p-4 border border-[#D4AF37]/30 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                    <img
                      src={heroPrimaryImage}
                      alt={primaryHeroProduct?.name || 'Modena Culinary Masterpiece'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Bottom Assurance Banner */}
                <div className="pt-3 border-t border-[#EAE3D7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-medium text-[#5E5953]">Zero chemical coating</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#C91F26]">
                    Custom Inscribed
                  </span>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CORPORATE GIFTING ENQUIRY FORM */}
        {/* ========================================================================= */}
        <section 
          id="enquiry-form" 
          className="relative scroll-mt-24 max-w-3xl mx-auto bg-white rounded-3xl border border-[#EAE3D7] p-8 sm:p-12 md:p-14 shadow-[0_12px_45px_rgba(212,175,55,0.08)] mb-24 sm:mb-32 overflow-hidden transition-all duration-300"
        >
          {/* Subtle Golden Ambient Accent */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#C91F26]/5 via-transparent to-transparent pointer-events-none rounded-bl-3xl" />

          {/* Form Header */}
          <div className="relative z-10 text-center max-w-lg mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE3D7] text-[#8C5A24] text-[10px] font-bold tracking-widest uppercase mb-3">
              <Mail className="w-3 h-3 text-[#D4AF37]" />
              <span>DIRECT CORPORATE DESK</span>
            </div>
            <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-[#292725] tracking-tight mb-2">
              Corporate Gifting Enquiry
            </h2>
            <p className="text-xs sm:text-sm text-[#716D67] leading-relaxed">
              Connect with our corporate gifting concierge for tailored volume pricing, personalized samples, and custom packaging.
            </p>
          </div>

          {submitSuccess ? (
            <div className="relative z-10 bg-[#FAF9F6] border border-[#EAE3D7] rounded-2xl p-8 sm:p-10 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-xl text-[#292725] mb-2 font-display-lg">
                Thank you. Your enquiry has been received.
              </h3>
              <p className="text-xs sm:text-sm text-[#5E5953] max-w-md mx-auto mb-6 leading-relaxed">
                Our corporate gifting specialist will review your request and get in touch with a customized proposal within 24 business hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="px-6 py-2.5 rounded-full bg-white border border-[#D8D4CD] text-xs font-bold text-[#292725] hover:bg-[#F3EFE9] transition-colors cursor-pointer shadow-xs"
              >
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="relative z-10 space-y-5 text-xs font-inter" noValidate>
              
              {/* Submission Error Alert */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span className="font-medium text-xs leading-relaxed">{submitError}</span>
                </div>
              )}

              {/* Honeypot Spam Protection (Hidden from humans) */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}>
                <label htmlFor="website_url">Leave this field blank</label>
                <input
                  id="website_url"
                  type="text"
                  name="website_url"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                />
              </div>

              {/* Row 1: Full Name & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block font-bold text-[#292725] mb-1.5">
                    Full Name <span className="text-[#C91F26]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="e.g. Mohnish Niranjhan"
                    className={`w-full bg-[#FAF9F6] border ${
                      formErrors.fullName ? 'border-[#C91F26] ring-1 ring-[#C91F26]/30' : 'border-[#EAE3D7]'
                    } rounded-xl px-4 py-3.5 text-xs text-[#292725] placeholder:text-[#9E9A93] focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all`}
                  />
                  {formErrors.fullName && (
                    <p className="text-[#C91F26] text-[11px] font-semibold mt-1">
                      {formErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#292725] mb-1.5">
                    Company Name <span className="text-[#C91F26]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="e.g. Acme Enterprises Pvt. Ltd."
                    className={`w-full bg-[#FAF9F6] border ${
                      formErrors.companyName ? 'border-[#C91F26] ring-1 ring-[#C91F26]/30' : 'border-[#EAE3D7]'
                    } rounded-xl px-4 py-3.5 text-xs text-[#292725] placeholder:text-[#9E9A93] focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all`}
                  />
                  {formErrors.companyName && (
                    <p className="text-[#C91F26] text-[11px] font-semibold mt-1">
                      {formErrors.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Work Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block font-bold text-[#292725] mb-1.5">
                    Work Email <span className="text-[#C91F26]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="name@company.com"
                    className={`w-full bg-[#FAF9F6] border ${
                      formErrors.email ? 'border-[#C91F26] ring-1 ring-[#C91F26]/30' : 'border-[#EAE3D7]'
                    } rounded-xl px-4 py-3.5 text-xs text-[#292725] placeholder:text-[#9E9A93] focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all`}
                  />
                  {formErrors.email && (
                    <p className="text-[#C91F26] text-[11px] font-semibold mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#292725] mb-1.5">
                    Phone Number <span className="text-[#C91F26]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full bg-[#FAF9F6] border ${
                      formErrors.phone ? 'border-[#C91F26] ring-1 ring-[#C91F26]/30' : 'border-[#EAE3D7]'
                    } rounded-xl px-4 py-3.5 text-xs text-[#292725] placeholder:text-[#9E9A93] focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all`}
                  />
                  {formErrors.phone && (
                    <p className="text-[#C91F26] text-[11px] font-semibold mt-1">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Estimated Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-[#292725]">
                    Estimated Quantity (Units) <span className="text-[#C91F26]">*</span>
                  </label>
                  <span className="text-[11px] text-[#716D67]">Min. order 10 units</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="e.g. 50"
                  className={`w-full bg-[#FAF9F6] border ${
                    formErrors.quantity ? 'border-[#C91F26] ring-1 ring-[#C91F26]/30' : 'border-[#EAE3D7]'
                  } rounded-xl px-4 py-3.5 text-xs text-[#292725] placeholder:text-[#9E9A93] focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all`}
                />
                {formErrors.quantity && (
                  <p className="text-[#C91F26] text-[11px] font-semibold mt-1">
                    {formErrors.quantity}
                  </p>
                )}
              </div>

              {/* Message / Requirements */}
              <div>
                <label className="block font-bold text-[#292725] mb-1.5">
                  Message / Requirements <span className="text-[#C91F26]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Specify product preferences (e.g. Cookware sets, Mixer Grinders), target timeline, or custom packaging requirements..."
                  className={`w-full bg-[#FAF9F6] border ${
                    formErrors.message ? 'border-[#C91F26] ring-1 ring-[#C91F26]/30' : 'border-[#EAE3D7]'
                  } rounded-xl px-4 py-3.5 text-xs text-[#292725] placeholder:text-[#9E9A93] focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all resize-y leading-relaxed`}
                />
                {formErrors.message && (
                  <p className="text-[#C91F26] text-[11px] font-semibold mt-1">
                    {formErrors.message}
                  </p>
                )}
              </div>

              {/* Submit Button with Interactive Golden Shimmer */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onMouseEnter={triggerButtonSparkles}
                  className="group relative w-full bg-[#C91F26] hover:bg-[#A9181E] disabled:bg-gray-400 text-white py-4 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#C91F26]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden"
                >
                  {/* Subtle Light Sweep on Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out pointer-events-none" />

                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Proposal Request...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Send Enquiry</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#FFE27D] opacity-80 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                    </>
                  )}
                </button>
              </div>

              {/* Direct Concierge Contact Assurance */}
              <div className="pt-4 text-center text-xs text-[#716D67] flex items-center justify-center gap-2">
                <span>Need urgent assistance? </span>
                <a href="tel:+919136669608" className="font-bold text-[#292725] hover:text-[#C91F26] transition-colors underline">
                  Call Corporate Concierge (+91 91366 69608)
                </a>
              </div>
            </form>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. RECOMMENDED GIFTING PRODUCTS */}
        {/* ========================================================================= */}
        <section id="recommended-products" className="scroll-mt-24 mb-16 relative">
          
          {/* Section Header (Single Clean Heading as strictly required) */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="font-display-lg text-3xl sm:text-4xl font-bold text-[#292725] tracking-tight mb-2.5">
              Recommended Gifting Products
            </h2>
            <p className="text-xs sm:text-sm text-[#716D67] leading-relaxed">
              Curated Modena culinary masterpieces engineered for enduring corporate and festive gifting.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE3D7]">
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A059] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#716D67]">Loading recommended gifting collections...</p>
            </div>
          ) : giftingProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {giftingProducts.map((product) => {
                const imageSrc = product.image || product.images?.[0] || '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';
                const imageAlt = product.name;
                const isAdding = addingId === product.id;
                const isAdded = addedId === product.id;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-[#EAE3D7] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-[#D4AF37]/50 transition-all duration-300 group"
                  >
                    {/* Image Pedestal Container */}
                    <div
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                      className="relative aspect-4/3 bg-[#FAF8F5] flex items-center justify-center p-6 cursor-pointer overflow-hidden border-b border-[#F0ECE4]"
                    >
                      <img
                        src={imageSrc}
                        alt={imageAlt}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Details Content */}
                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        {/* Rating Row */}
                        {(() => {
                          const parsedAvg = parseFloat(product.average_rating !== undefined ? product.average_rating : product.rating);
                          const parsedCount = parseInt(product.rating_count !== undefined ? product.rating_count : product.review_count, 10);
                          const hasRealReviews = !isNaN(parsedAvg) && parsedAvg > 0 && !isNaN(parsedCount) && parsedCount > 0;

                          if (hasRealReviews) {
                            return (
                              <div className="flex items-center gap-1.5 mb-2.5 text-xs">
                                <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px] flex items-center gap-0.5">
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
                                  ({parsedCount})
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex items-center gap-1.5 mb-2.5 text-xs">
                              <span className="text-[11px] font-semibold text-[#716D67] bg-[#EAE7E1] px-2 py-0.5 rounded-full">
                                Premium Quality
                              </span>
                            </div>
                          );
                        })()}

                        {/* Title */}
                        <h3
                          onClick={() => onSelectProduct && onSelectProduct(product)}
                          className="font-bold text-sm text-[#292725] hover:text-[#C91F26] transition-colors line-clamp-2 cursor-pointer mb-2 leading-snug"
                        >
                          {product.name}
                        </h3>

                        {/* Short Description */}
                        <p className="text-xs text-[#716D67] line-clamp-2 mb-4 leading-relaxed font-normal">
                          {product.short_description || product.desc || 'Premium kitchenware crafted for everyday reliability.'}
                        </p>
                      </div>

                      {/* Pricing & CTA Controls */}
                      <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] text-[#716D67] font-semibold uppercase tracking-wider">MRP / Unit</div>
                          <div className="text-base font-extrabold text-[#292725]">
                            {product.price || (product.numericPrice ? `₹${product.numericPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹999.00')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectProduct && onSelectProduct(product)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#292725] bg-[#F8F7F4] hover:bg-[#EAE7E1] border border-[#D8D4CD] transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          <CartQuantityControl
                            product={product}
                            cart={cart}
                            onAddToCart={onAddToCart}
                            onUpdateQuantity={onUpdateQuantity}
                            size="icon"
                            buttonText="Add to Cart"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE3D7]">
              <p className="text-sm font-medium text-[#716D67]">No corporate gifting products currently available.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default CorporateGifting;
