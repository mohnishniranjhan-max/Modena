import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  Truck,
  Lock,
  Award,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scale,
  CreditCard,
  Building2,
  Sparkles,
  HelpCircle,
  Clock,
  PackageCheck
} from 'lucide-react';

/**
 * StorePolicies Component
 * Single Source of Truth: Modena — Store Policies (Draft v2) [Last updated: 8 August 2026]
 * Refactored for plain, simple English while maintaining exact legal accuracy.
 */
const StorePolicies = ({ onBack, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'terms', name: 'Terms & Conditions', icon: FileText, tag: 'LEGAL CONTRACT' },
    { id: 'returns', name: 'Return & Refund Policy', icon: RotateCcw, tag: '7-DAY RETURN' },
    { id: 'shipping', name: 'Shipping Policy', icon: Truck, tag: 'FREE OVER ₹2,999' },
    { id: 'privacy', name: 'Privacy Policy', icon: Lock, tag: 'PRIVACY & DATA' },
    { id: 'warranty', name: 'Warranty Policy', icon: Award, tag: 'MOTOR WARRANTY' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter text-[#292725]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="hover:text-[#C91F26] cursor-pointer flex items-center gap-2 text-xs font-semibold text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Account</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>Modena Home</span>
          <span>›</span>
          <span className="text-[#C91F26] font-semibold">Store Policies</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-6 pb-6 border-b border-gray-200/80">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight">
          Store &amp; Legal Policies
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Official store policies, terms, shipping timelines, returns, and warranty coverage for modenahome.in.
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 border-b border-gray-200/80 pb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#C91F26] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="space-y-8">
        {/* Policy Panel */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
                  Terms &amp; Conditions
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: 8 August 2026
                </p>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <p>
                  Welcome to <strong>modenahome.in</strong> (“Website”), owned and operated by <strong>Kimatsu India Pvt. Ltd.</strong>, 201–202 Tirupati Udyog, I.B. Patel Road, Goregaon East, Mumbai – 400063 (“Modena”, “we”, “us”, “our”). GSTIN: <strong>27AAFCK9795E1ZZ</strong>. By accessing this Website or placing an order, you agree to these Terms &amp; Conditions.
                </p>

                <div className="space-y-4">
                  <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#E60000]" />
                      <span>Eligibility</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      You must be at least 18 years of age, or accessing the Website under the supervision of a parent or legal guardian.
                    </p>
                  </div>

                  <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#E60000]" />
                      <span>Products &amp; Pricing</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      All prices are listed in Indian Rupees (₹) and are inclusive of GST unless stated otherwise. We make every effort to display product colors, specifications, and details accurately; however, actual products may vary slightly. We reserve the right to correct pricing errors and to modify or discontinue products without prior notice.
                    </p>
                  </div>

                  <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#E60000]" />
                      <span>Order Acceptance</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      Your order is an offer to purchase. We reserve the right to accept or decline any order, including where a product is out of stock, a pricing error has occurred, or the order fails our fraud checks. A contract is formed only once we confirm dispatch.
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-1">
                    <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>Payments</span>
                    </h3>
                    <p className="text-xs text-emerald-800">
                      We accept prepaid payments only (UPI, cards, net banking, and wallets). <strong>Cash on Delivery is not available.</strong>
                    </p>
                  </div>

                  <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#E60000]" />
                      <span>Intellectual Property</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      The Modena wordmark, logo, product designs, images, and all Website content are the property of Kimatsu India Pvt. Ltd. and may not be reproduced, distributed, or used without written permission.
                    </p>
                  </div>

                  <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#E60000]" />
                      <span>Limitation of Liability &amp; Third-Party Links</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      To the maximum extent permitted by law, Modena shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of, or inability to use, this Website or our products. The Website may contain links to third-party sites; we are not responsible for the content or privacy practices of those sites.
                    </p>
                  </div>

                  <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#E60000]" />
                      <span>Governing Law &amp; Jurisdiction</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of <strong>Mumbai, Maharashtra</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Questions about Terms &amp; Conditions? Email <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold hover:underline">support@modenahome.in</a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RETURN, REFUND & CANCELLATION POLICY */}
          {activeTab === 'returns' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
                  Return, Refund &amp; Cancellation Policy
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: 8 August 2026
                </p>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <p>
                  We want you to love your Modena purchase. If something isn’t right, here’s how returns work.
                </p>

                {/* Cancellations */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E60000]" />
                    <span>Cancellations</span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    You may cancel your order within <strong>2 hours of placing it</strong>, or any time before it is dispatched — whichever is earlier — by emailing <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold">support@modenahome.in</a> with your order number. Once an order is dispatched, it cannot be cancelled.
                  </p>
                </div>

                {/* 7-Day Return Window */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-3">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#E60000]" />
                    <span>7-Day Return Window</span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    You may request a return within <strong>7 days of delivery</strong>, provided:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                    <li>The product is <strong>unused, unwashed, and in its original condition</strong></li>
                    <li>All original packaging, tags, manuals, and free items/accessories are intact</li>
                    <li>You have proof of purchase</li>
                  </ul>
                  <p className="text-xs text-gray-600 pt-1">
                    To initiate a return, email <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold">support@modenahome.in</a> within 7 days of delivery with your order number and reason.
                  </p>
                </div>

                {/* Return Shipping Costs */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#E60000]" />
                    <span>Return Shipping Costs</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                    <li><strong>Non-defective returns</strong> (e.g. change of mind, ordered by mistake): the customer bears the return shipping cost.</li>
                    <li><strong>Defective, damaged-in-transit, or wrong items</strong>: Modena bears the full cost of return and replacement.</li>
                  </ul>
                </div>

                {/* Damaged or Wrong Items */}
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Damaged or Wrong Items</span>
                  </h3>
                  <p className="text-xs text-amber-800">
                    If your item arrives damaged or you received the wrong product, report it within <strong>48 hours of delivery</strong> with photos and, where possible, an <strong>unboxing video</strong>. Damage claims without supporting media may not be accepted.
                  </p>
                </div>

                {/* Category-Specific Conditions */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h3 className="font-bold text-sm text-[#2A2724]">Category-Specific Conditions</h3>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <h4 className="font-bold text-gray-800">Cast Iron Cookware</h4>
                    <p>Cast iron is a natural, hand-finished material. The following are inherent characteristics, not defects, and are not eligible for return or refund:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Variations in seasoning colour, darkening, or patina</li>
                      <li>Minor surface rust (removable with re-seasoning)</li>
                      <li>Small cosmetic casting marks, texture variation, or weight variation</li>
                    </ul>
                    <p className="pt-1">
                      Genuine manufacturing defects — cracks, structural casting flaws, or broken handles — are covered. Used cast iron cannot be returned for hygiene reasons unless a manufacturing defect is confirmed.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 border-t border-gray-200 pt-3">
                    <h4 className="font-bold text-gray-800">Appliances (Mixer Grinders &amp; Personal Blenders)</h4>
                    <p>
                      Returns are accepted for unused units within 7 days. Once used, appliances are covered under the Warranty Policy rather than returns, except for verified manufacturing defects reported on arrival.
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 border-t border-gray-200 pt-3">
                    <p><strong>Non-returnable:</strong> Used cookware/appliances (absent a defect), and products without original packaging.</p>
                  </div>
                </div>

                {/* Refunds */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#E60000]" />
                    <span>Refunds</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                    <li>We offer prepaid payments only, so all refunds are issued to the <strong>original payment source</strong>.</li>
                    <li>Refunds are processed within <strong>5–7 business days</strong> after we receive and quality-check the returned item.</li>
                    <li>Original shipping charges (if any) are non-refundable on change-of-mind returns.</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  To request a return or cancellation, email <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold hover:underline">support@modenahome.in</a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHIPPING POLICY */}
          {activeTab === 'shipping' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
                  Shipping Policy
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: 8 August 2026
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E60000]" />
                    <span>Where We Ship</span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    We currently deliver across India to all serviceable pincodes. Enter your pincode on the product page to confirm serviceability.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Free Shipping</span>
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Enjoy <strong>free shipping on all orders above ₹2,999</strong>. Orders below ₹2,999 attract a flat shipping fee of <strong>₹300</strong>, shown at checkout.
                  </p>
                </div>

                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E60000]" />
                    <span>Dispatch &amp; Delivery Timelines</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                    <li><strong>Dispatch time:</strong> Orders are dispatched within <strong>1 business day</strong> of order confirmation (excluding Sundays and public holidays).</li>
                    <li><strong>Delivery time:</strong> Estimated delivery is typically <strong>3–7 business days</strong> after dispatch, depending on your location. Remote pincodes may take longer.</li>
                    <li><strong>Tracking:</strong> Once your order ships, you’ll receive tracking details by email/SMS.</li>
                  </ul>
                </div>

                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#E60000]" />
                    <span>Payment &amp; Courier Delays</span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    All orders are prepaid; Cash on Delivery is not available. We are not liable for delays caused by courier partners, weather, or events beyond our control, but we will always help you track and resolve issues.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Questions about shipping? Email <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold hover:underline">support@modenahome.in</a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
                  Privacy Policy
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: 8 August 2026 • Compliant with Information Technology Act, 2000
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <p>
                  This Privacy Policy explains how <strong>Kimatsu India Pvt. Ltd.</strong> (“Modena”) collects, uses, stores, and protects your personal data when you use modenahome.in, in accordance with applicable data protection laws.
                </p>

                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724]">Information We Collect</h3>
                  <p className="text-xs text-gray-600">
                    Name, email, phone number, billing/shipping address, order history, and payment information (processed securely by our payment gateway — we do not store card details). We also collect device and usage data via cookies and analytics tools.
                  </p>
                </div>

                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724]">How We Use &amp; Share Your Data</h3>
                  <p className="text-xs text-gray-600">
                    To process and deliver orders; provide customer support; send order updates; improve our products and Website; and, with your consent, send marketing communications. We share data only with service providers necessary to fulfil your order — couriers, payment gateways, and analytics/marketing platforms (e.g. Meta, Google) — under appropriate safeguards. <strong>We do not sell your personal data.</strong>
                  </p>
                </div>

                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724]">Cookies &amp; Data Retention</h3>
                  <p className="text-xs text-gray-600">
                    We use cookies and pixels (including Meta Pixel and Google) for functionality, analytics, and advertising. You can manage cookie preferences via our consent banner. We retain your data only as long as necessary to fulfil the purposes above or as required by law, after which it is securely deleted.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>Your Privacy Rights</span>
                  </h3>
                  <p className="text-xs text-blue-800">
                    You have the right to access, update, or request deletion of your personal data at any time. To exercise these rights or for any privacy-related questions, please contact our support team at <a href="mailto:support@modenahome.in" className="underline font-bold">support@modenahome.in</a>.
                  </p>
                </div>

                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724]">Security &amp; Children</h3>
                  <p className="text-xs text-gray-600">
                    We use reasonable technical and organisational measures — including SSL encryption and access controls — to protect your data. No method of transmission is 100% secure, but we work to safeguard your information. Our Website is not directed at children under 18, and we do not knowingly collect their data.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Contact: <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold hover:underline">support@modenahome.in</a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WARRANTY POLICY */}
          {activeTab === 'warranty' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
                  Warranty Policy
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: 8 August 2026
                </p>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <p>
                  Modena stands behind its products. Warranty coverage varies by category as below. Warranty applies only to products purchased through modenahome.in or authorised channels, with valid proof of purchase.
                </p>

                {/* Coverage Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F6] border-b border-gray-200 text-[#2A2724] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 sm:p-4">Category</th>
                        <th className="p-3.5 sm:p-4">Warranty Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      <tr>
                        <td className="p-3.5 sm:p-4 font-bold text-gray-900">Mixer Grinders</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-[#E60000]">5 years on the motor only</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 sm:p-4 font-bold text-gray-900">Personal Blenders (NutriCharge)</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-[#E60000]">2 years on the motor only</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 sm:p-4 font-bold text-gray-900">Cast Iron &amp; Cookware</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-gray-800">Manufacturing defects only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* What's Covered */}
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>What’s Covered</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-emerald-800">
                    <li><strong>Mixer Grinders / Blenders:</strong> manufacturing defects in the motor for the stated period.</li>
                    <li><strong>Cookware:</strong> genuine manufacturing defects such as casting flaws, cracks, or structural failure.</li>
                  </ul>
                </div>

                {/* What's NOT Covered */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E60000]" />
                    <span>What’s NOT Covered</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                    <li>Normal wear and tear</li>
                    <li><strong>Consumable / wear parts</strong> — jars, blades, gaskets, couplers, lids, and other accessories</li>
                    <li>Damage from misuse, abuse, dropping, or improper cleaning</li>
                    <li>Damage from voltage fluctuation, water ingress, fire, pests, or natural disasters</li>
                    <li>Unauthorised repairs or modifications</li>
                    <li>Cosmetic wear, and (for cast iron) seasoning changes, patina, or surface rust from normal use</li>
                    <li>Products used commercially or outside recommended instructions</li>
                  </ul>
                </div>

                {/* How to Claim */}
                <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#2A2724] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#E60000]" />
                    <span>How to Claim Warranty</span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    Email <a href="mailto:support@modenahome.in" className="text-[#E60000] font-bold">support@modenahome.in</a> with your order number, a description of the issue, and photos/video. Our team will assess and advise on repair or replacement. Warranty covers the defective part; it does not extend the original warranty period.
                  </p>
                  <p className="text-xs text-gray-800 font-bold pt-1">
                    Contact: <a href="mailto:support@modenahome.in" className="text-[#E60000]">support@modenahome.in</a> | <a href="tel:+919326641825" className="text-[#E60000]">+91 93266 41825</a> (Business hours: Monday–Saturday, 10:00 AM – 6:00 PM)
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StorePolicies;
