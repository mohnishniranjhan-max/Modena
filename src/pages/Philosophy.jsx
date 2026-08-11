import React from 'react';
import {
  Flame,
  Zap,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';

const Philosophy = ({ setCurrentView }) => {
  const brandStats = [
    { value: '25+', label: 'Years of Engineering Mastery' },
    { value: '500,000+', label: 'Happy Indian Kitchens' },
    { value: '4.9 / 5', label: 'Verified Customer Rating' },
    { value: '100%', label: 'Grade-A Copper Motors & Pure Steel' }
  ];

  const pillars = [
    {
      icon: Flame,
      title: 'Lava-Fired Cast Iron',
      subtitle: 'Natural Heat Retentivity',
      desc: 'Pre-seasoned with 100% natural cold-pressed organic oils. Our heavy-grade virgin cast iron retains maximum thermal heat for authentic Indian slow cooking, biryanis, and crispy dosas.'
    },
    {
      icon: Zap,
      title: '100% Copper Motors',
      subtitle: '990W Commercial Torque',
      desc: 'Commercial-grade 990W heavy-duty copper winding with dual airflow cooling systems engineered to grind tough Indian batters, whole turmeric, and dry spices effortlessly without power drop-off.'
    },
    {
      icon: ShieldCheck,
      title: '304 Food-Grade Build',
      subtitle: 'Zero Toxic Coatings',
      desc: '100% chemical-free food-grade stainless steel jars, precision-laser blades, and non-reactive cooking surfaces ensuring your food retains pure natural flavor and nutrition.'
    },
    {
      icon: Award,
      title: 'Lifetime Service Guarantee',
      subtitle: 'Pan-India Service Assurance',
      desc: 'Backed by direct Modena service support, genuine replacement parts availability, and robust doorstep repair logistics across 18,000+ pin codes.'
    }
  ];

  const engineeringSpecs = [
    {
      feature: 'Motor Winding & Efficiency',
      modena: '100% Grade-A Pure Copper (990W High-Torque)',
      standard: 'Aluminum or Hybrid Copper (500W-750W)'
    },
    {
      feature: 'Thermal Overload Safety',
      modena: 'Dual Airflow Vents & Auto-Cut Circuit Breaker',
      standard: 'Single Rear Vent with Passive Fuse'
    },
    {
      feature: 'Cookware Body & Heat Distribution',
      modena: 'Heavy 3-Ply / 5-Ply Encapsulated Aluminum Core',
      standard: 'Single Layer Stainless Steel or Thin Coating'
    },
    {
      feature: 'Food-Contact Surfaces',
      modena: '304 Surgical Grade Stainless Steel & Natural Iron',
      standard: 'Synthetic Non-Stick Chemical Coatings'
    },
    {
      feature: 'Warranty & Service Backing',
      modena: 'Lifetime Heritage Guarantee + Home Support',
      standard: '1-Year Limited Carry-In Warranty'
    }
  ];

  return (
    <div className="bg-[#EFEAE6] text-[#2A2724] min-h-screen py-10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <button
            onClick={() => setCurrentView('yourAccount')}
            className="hover:text-[#E60000] cursor-pointer flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Your Account
          </button>
          <span>›</span>
          <span className="text-[#E60000] font-bold">Modena Philosophy &amp; Craftsmanship</span>
        </div>

        {/* 1. HERO BANNER CARD */}
        <div className="bg-[#2A2724] text-white rounded-3xl p-8 sm:p-12 shadow-2xl mb-12 relative overflow-hidden border border-[#514C48]">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E60000]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#E60000] text-white text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE MODENA PROMISE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none uppercase">
              Designed for Lifelong Retentivity and Culinary Precision
            </h1>

            <p className="text-sm sm:text-base text-[#EFEAE6] leading-relaxed font-medium">
              Every piece of Modena cookware and kitchen machinery is engineered for longevity. We marry heavy-duty motors and steel bodies with natural warmth so your kitchen performs at professional standards.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setCurrentView('bestseller')}
                className="bg-[#E60000] hover:bg-red-800 text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-none"
              >
                <span>EXPLORE BESTSELLER MACHINERY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('utensils')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs sm:text-sm font-bold px-7 py-3.5 rounded-full transition-all cursor-pointer backdrop-blur-md"
              >
                VIEW HERITAGE COOKWARE
              </button>
            </div>
          </div>
        </div>

        {/* 2. STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          {brandStats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-[#E60000] mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-[#2A2724] tracking-wide uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* 3. FOUR CORE ENGINEERING PILLARS */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-extrabold text-[#E60000] tracking-widest uppercase block">
              UNCOMPROMISING STANDARDS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
              Pillars of Modena Culinary Engineering
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              How we construct heavy appliances and heirloom cookware to outlast generations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF8F6] text-[#E60000] flex items-center justify-center group-hover:bg-[#E60000] group-hover:text-white transition-colors duration-300 shadow-xs">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#E60000] tracking-wider uppercase block mb-1">
                        {item.subtitle}
                      </span>
                      <h3 className="font-bold text-lg text-[#2A2724] leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. SPECIFICATIONS & QUALITY COMPARISON TABLE */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-sm mb-12">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <span className="text-xs font-extrabold text-[#E60000] tracking-widest uppercase block mb-1">
                BENCHMARK COMPARISON
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2724] tracking-tight">
                Modena vs Standard Market Appliances
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-sm">
              Tested under commercial high-duty kitchen conditions for thermal stability and retentivity.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Engineering Feature</th>
                  <th className="py-3 px-4 font-bold text-[#E60000] bg-[#FAF8F6]/50 rounded-t-xl">
                    Modena Heritage Grade
                  </th>
                  <th className="py-3 px-4 font-bold text-gray-600">Standard Appliances</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {engineeringSpecs.map((spec, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#2A2724]">{spec.feature}</td>
                    <td className="py-4 px-4 font-bold text-[#E60000] bg-[#FAF8F6]/30 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#E60000] flex-shrink-0" />
                      <span>{spec.modena}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-500">{spec.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. FOOTER RETURN NAVIGATION */}
        <div className="bg-[#2A2724] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-[#514C48]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E60000] text-white flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Have questions about our philosophy?</h4>
              <p className="text-xs text-gray-300">Contact our culinary support team 24/7 anytime.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentView('contactUs')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer border border-white/20 flex-1 sm:flex-none text-center"
            >
              Contact Support
            </button>
            <button
              onClick={() => setCurrentView('yourAccount')}
              className="bg-[#E60000] hover:bg-red-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer flex-1 sm:flex-none text-center shadow-md"
            >
              Back to Your Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Philosophy;
