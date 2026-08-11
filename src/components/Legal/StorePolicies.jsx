import React, { useState } from 'react';
import { ShieldCheck, FileText, RotateCcw, Truck, Lock, Award, Mail, Phone, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';

const StorePolicies = ({ onBack, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'terms', name: '1. Terms & Conditions', icon: FileText },
    { id: 'returns', name: '2. Return & Refund Policy', icon: RotateCcw },
    { id: 'shipping', name: '3. Shipping Policy', icon: Truck },
    { id: 'privacy', name: '4. Privacy Policy', icon: Lock },
    { id: 'warranty', name: '5. Warranty Policy', icon: Award }
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300 font-inter text-[#2A2724]">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <button onClick={onBack} className="hover:text-[#E60000] cursor-pointer flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Your Account</span>
        </button>
        <span>›</span>
        <span className="text-[#E60000] font-semibold">Store Policies & Legal Terms</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2A2724] via-[#2A2724] to-[#2A2724] text-white p-6 sm:p-10 rounded-3xl mb-8 shadow-xl border border-[#333]">
        <div className="inline-flex items-center gap-2 bg-[#E60000] text-white text-xs font-label-caps px-3.5 py-1 rounded-full mb-3 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>OFFICIAL STORE POLICIES (v2)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-inter text-white mb-2">
          Modena Terms, Guarantees &amp; Privacy
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed font-normal">
          Benchmarked against Indian D2C kitchenware standards &amp; DPDP Act 2023. Operated by Kimatsu India Pvt. Ltd. (GSTIN: 27AAFCK9795E1ZZ).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Tabs */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#E60000] text-white shadow-md'
                      : 'text-gray-700 hover:bg-[#FAF8F6] hover:text-[#E60000]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#E60000]'}`} />
                    <span>{tab.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90 text-white' : 'text-gray-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Quick Contact Box */}
          <div className="bg-[#FAF8F6] border border-[#E2DCD7] rounded-2xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-[#E60000] uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              <span>Grievance &amp; Support</span>
            </h4>
            <p className="text-gray-700 text-[11px] leading-relaxed">
              Have questions regarding returns, warranty, or data privacy? Our support team is available Mon-Sat, 10:00 AM - 6:00 PM.
            </p>
            <div className="space-y-1.5 font-medium text-gray-800 text-[11px]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E60000]" />
                <a href="mailto:support@modenahome.in" className="hover:underline">support@modenahome.in</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E60000]" />
                <a href="mailto:grievance@modenahome.in" className="hover:underline">grievance@modenahome.in</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E60000]" />
                <span><a href="https://wa.me/919326641825" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">+91 93266 41825</a> (Phone &amp; WhatsApp) / +91 91366 69608</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm text-sm space-y-6 leading-relaxed">
          
          {/* 1. TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider block">Official Policy</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-0.5">1. Terms &amp; Conditions</h2>
                <p className="text-xs text-gray-400 mt-1">Last updated: 8 August 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <p>
                  Welcome to <strong>modenahome.in</strong> (“Website”), owned and operated by <strong>Kimatsu India Pvt. Ltd.</strong>, 201–202 Tirupati Udyog, I.B. Patel Road, Goregaon East, Mumbai – 400063 (“Modena”, “we”, “us”, “our”). GSTIN: <strong>27AAFCK9795E1ZZ</strong>. By accessing this Website or placing an order, you agree to these Terms &amp; Conditions.
                </p>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Eligibility</h3>
                  <p>You must be at least 18 years of age, or accessing the Website under the supervision of a parent or legal guardian.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Products &amp; Pricing</h3>
                  <p>All prices are listed in Indian Rupees (₹) and are inclusive of GST unless stated otherwise. We make every effort to display product colours, specifications, and details accurately; however, actual products may vary slightly. We reserve the right to correct pricing errors and to modify or discontinue products without prior notice.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Order Acceptance</h3>
                  <p>Your order is an offer to purchase. We reserve the right to accept or decline any order, including where a product is out of stock, a pricing error has occurred, or the order fails our fraud checks. A contract is formed only once we confirm dispatch.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Payments</h3>
                  <p>We accept prepaid payments only (UPI, Zoho Pay, credit/debit cards, net banking, and digital wallets). Cash on Delivery is not available.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Intellectual Property</h3>
                  <p>The Modena wordmark, logo, product designs, images, and all Website content are the property of Kimatsu India Pvt. Ltd. and may not be reproduced, distributed, or used without written permission.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Limitation of Liability</h3>
                  <p>To the maximum extent permitted by law, Modena shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of, or inability to use, this Website or our products.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Governing Law &amp; Jurisdiction</h3>
                  <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. RETURN, REFUND & CANCELLATION POLICY */}
          {activeTab === 'returns' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider block">Official Policy</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-0.5">2. Return, Refund &amp; Cancellation Policy</h2>
                <p className="text-xs text-gray-400 mt-1">Last updated: 8 August 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <div className="bg-[#FAF8F6] p-4 rounded-2xl border border-[#E2DCD7] space-y-1 text-xs">
                  <strong className="text-[#E60000] font-bold block">Cancellations</strong>
                  <p>You may cancel your order within 2 hours of placing it, or any time before it is dispatched — whichever is earlier — by emailing support@modenahome.in with your order number. Once an order is dispatched, it cannot be cancelled.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">7-Day Return Window</h3>
                  <p>You may request a return within 7 days of delivery, provided:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                    <li>The product is unused, unwashed, and in its original condition</li>
                    <li>All original packaging, tags, manuals, and free items/accessories are intact</li>
                    <li>You have valid proof of purchase</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Return Shipping Costs</h3>
                  <p><strong>For non-defective returns:</strong> (e.g. change of mind, ordered by mistake): the customer bears the return shipping cost.</p>
                  <p><strong>For defective, damaged-in-transit, or wrong items:</strong> Modena bears the full cost of return and replacement.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Damaged or Wrong Items</h3>
                  <p>If your item arrives damaged or you received the wrong product, report it within <strong>48 hours of delivery</strong> with photos and, where possible, an unboxing video. Damage claims without supporting media may not be accepted.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Category-Specific Conditions</h3>
                  <p><strong>Cast Iron Cookware:</strong> Cast iron is a natural, hand-finished material. The following are inherent characteristics, not defects, and are not eligible for return or refund:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                    <li>Variations in seasoning colour, darkening, or patina</li>
                    <li>Minor surface rust (removable with re-seasoning)</li>
                    <li>Small cosmetic casting marks, texture variation, or weight variation</li>
                  </ul>
                  <p className="mt-2">Genuine manufacturing defects — cracks, structural casting flaws, or broken handles — are covered. Used cast iron cannot be returned for hygiene reasons unless a manufacturing defect is confirmed.</p>
                  <p className="mt-2"><strong>Appliances (Mixer Grinders &amp; Personal Blenders):</strong> Returns are accepted for unused units within 7 days. Once used, appliances are covered under the Warranty Policy rather than returns, except for verified manufacturing defects reported on arrival.</p>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <h3 className="font-bold text-gray-900">Refund Processing</h3>
                  <p>We offer prepaid payments only, so all refunds are issued directly to the original payment source (UPI / Card / NetBanking) within <strong>5–7 business days</strong> after we receive and quality-check the returned item.</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. SHIPPING POLICY */}
          {activeTab === 'shipping' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider block">Official Policy</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-0.5">3. Shipping Policy</h2>
                <p className="text-xs text-gray-400 mt-1">Last updated: 8 August 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#FAF8F6] p-4 rounded-2xl border border-[#E2DCD7]">
                    <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider block">FREE SHIPPING THRESHOLD</span>
                    <h4 className="font-bold text-base text-gray-900 mt-1">Orders Above ₹2,999</h4>
                    <p className="text-xs text-gray-600 mt-1">Enjoy 100% Free Express Logistics across all pincodes in India.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">FLAT RATE SHIPPING</span>
                    <h4 className="font-bold text-base text-gray-900 mt-1">Orders Below ₹2,999</h4>
                    <p className="text-xs text-gray-600 mt-1">Attracts a flat shipping fee of <strong>₹300</strong>, shown at checkout.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-gray-900">Where We Ship</h3>
                  <p>We currently deliver across India to all serviceable pincodes via air and express ground logistics partners (BlueDart, Delhivery, Ekart).</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Dispatch &amp; Delivery Timeline</h3>
                  <p><strong>Dispatch Time:</strong> Orders are dispatched within <strong>1 business day</strong> of order confirmation (excluding Sundays and public holidays).</p>
                  <p><strong>Delivery Time:</strong> Estimated delivery is typically <strong>3–7 business days</strong> after dispatch depending on your location. Remote pincodes may take slightly longer.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Order Tracking</h3>
                  <p>Once your order ships, you will receive real-time tracking details via email and SMS. All orders are 100% prepaid; Cash on Delivery is not available.</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider block">Official Policy</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-0.5">4. Privacy Policy (DPDP Act 2023 Compliant)</h2>
                <p className="text-xs text-gray-400 mt-1">Last updated: 8 August 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <p>
                  This Privacy Policy explains how <strong>Kimatsu India Pvt. Ltd.</strong> (“Modena”) collects, uses, stores, and protects your personal data when you use modenahome.in, in accordance with the Information Technology Act, 2000 and the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>.
                </p>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Information We Collect</h3>
                  <p>Name, email, phone number, billing/shipping address, order history, and payment information (processed securely by our payment gateway — we do not store raw credit/debit card details). We also collect device and usage data via cookies and analytics tools.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">How We Use Your Data</h3>
                  <p>To process and deliver orders; provide customer support; send order updates; improve our products and Website; and, with your consent, send marketing communications.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Data Sharing &amp; Rights</h3>
                  <p>We share data only with service providers necessary to fulfil your order — couriers, payment gateways, and analytics platforms (e.g. Meta, Google) under strict safeguards. We <strong>never sell your personal data</strong>.</p>
                  <p className="mt-2">Under the DPDP Act 2023, you have the right to access, correct, and request erasure of your personal data. Contact our Grievance Officer below to exercise your rights.</p>
                </div>

                <div className="bg-[#FAF8F6] p-4 rounded-2xl border border-[#E2DCD7] space-y-1 text-xs">
                  <strong className="text-[#E60000] font-bold block">Grievance Officer (DPDP Act 2023)</strong>
                  <p><strong>Name:</strong> Anurag Yadav</p>
                  <p><strong>Email:</strong> grievance@modenahome.in</p>
                  <p><strong>Phone:</strong> +91 91366 69608</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. WARRANTY POLICY */}
          {activeTab === 'warranty' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider block">Official Policy</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-0.5">5. Warranty Policy</h2>
                <p className="text-xs text-gray-400 mt-1">Last updated: 8 August 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <p>Modena stands behind its products. Warranty applies to products purchased through modenahome.in with valid proof of purchase.</p>

                {/* Warranty Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-200">
                        <th className="p-3">Category</th>
                        <th className="p-3">Warranty Period</th>
                        <th className="p-3">Coverage Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="p-3 font-bold text-gray-900">Mixer Grinders</td>
                        <td className="p-3 text-[#E60000] font-bold">5 Years</td>
                        <td className="p-3">Copper Motor manufacturing defects only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-gray-900">Personal Blenders (NutriCharge)</td>
                        <td className="p-3 text-[#E60000] font-bold">2 Years</td>
                        <td className="p-3">High-speed Motor manufacturing defects only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-gray-900">Cast Iron &amp; Cookware</td>
                        <td className="p-3 text-gray-700 font-bold">Lifetime</td>
                        <td className="p-3">Genuine casting flaws, cracks &amp; structural failure</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-gray-900">What’s NOT Covered</h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                    <li>Normal wear and tear</li>
                    <li>Consumable / wear parts — jars, blades, gaskets, couplers, lids, and accessories</li>
                    <li>Damage from misuse, abuse, dropping, or improper cleaning</li>
                    <li>Damage from voltage fluctuation, water ingress, fire, pests, or natural disasters</li>
                    <li>Unauthorised repairs or modifications</li>
                    <li>Cosmetic wear, seasoning patina, or surface rust from normal use</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1 text-xs">
                  <strong className="text-gray-900 font-bold block">How to Claim Warranty</strong>
                  <p>Email <strong>support@modenahome.in</strong> or call/WhatsApp <strong>+91 93266 41825</strong> (Mon-Sat, 10:00 AM - 6:00 PM) with your order number, issue description, and photos/video.</p>
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
