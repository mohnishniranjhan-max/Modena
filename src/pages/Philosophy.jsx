import React, { useEffect } from 'react';
import {
  Flame,
  Zap,
  ShieldCheck,
  CookingPot,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const Philosophy = ({ setCurrentView }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const pillars = [
    {
      icon: Flame,
      title: 'Pre-Seasoned Cast Iron',
      subtitle: 'Natural Heat Retention',
      desc: 'Made from heavy-gauge cast iron pre-seasoned with natural vegetable oils. Retains steady, even heat for traditional slow cooking, crisp dosas, and daily roasting without synthetic coatings.'
    },
    {
      icon: CookingPot,
      title: 'Tri-Ply Stainless Steel',
      subtitle: 'Uniform Heat Distribution',
      desc: 'Constructed with layered stainless steel and an aluminum core to eliminate hot spots. Ideal for sautéing, curries, and boiling across gas and induction stovetops.'
    },
    {
      icon: Zap,
      title: 'High-Torque Performance',
      subtitle: 'Dependable Daily Grinding',
      desc: 'Built with high-torque motors and sharp stainless steel blades engineered to handle Indian spices, idli-dosa batters, and chutneys with smooth consistency.'
    },
    {
      icon: ShieldCheck,
      title: 'Food-Grade Materials',
      subtitle: 'Safe & Non-Reactive',
      desc: 'We prioritize food-grade stainless steel with Zero chemical coating — no plastic or Teflon coating where food particles touch to protect natural aromas, nutrition, and authentic flavors in every dish.'
    }
  ];

  const engineeringSpecs = [
    {
      feature: 'Cookware Body & Base',
      modena: 'Heavy 3-Ply Tri-Ply Base & Solid Cast Iron',
      standard: 'Thin single-layer sheet metal'
    },
    {
      feature: 'Food-Contact Surfaces',
      modena: 'Food-Grade Stainless Steel & Natural Iron (Zero chemical coating — no plastic or Teflon coating where food particles touch)',
      standard: 'Synthetic non-stick chemical coatings'
    },
    {
      feature: 'Motor & Grinding Power',
      modena: 'High-Torque Motors with Dual Airflow Cooling',
      standard: 'Standard low-power motors with passive cooling'
    },
    {
      feature: 'Jars & Blade Construction',
      modena: 'Heavy-gauge stainless steel jars with laser-sharp blades',
      standard: 'Lightweight jars with plastic blade mounts'
    },
    {
      feature: 'Daily Usability & Handling',
      modena: 'Ergonomic heat-resistant handles & anti-skid rubber feet',
      standard: 'Basic lightweight hardware'
    }
  ];

  return (
    <div id="philosophy" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter text-[#292725]">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (setCurrentView) setCurrentView('home');
            window.location.hash = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="hover:text-[#C91F26] cursor-pointer flex items-center gap-2 text-xs font-semibold text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <button
            onClick={() => {
              if (setCurrentView) setCurrentView('home');
              window.location.hash = '';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-gray-600 cursor-pointer"
          >
            Home
          </button>
          <span>›</span>
          <span className="text-[#C91F26] font-semibold">About Us</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-8 pb-6 border-b border-gray-200/80">
        <span className="text-xs font-bold text-[#C91F26] uppercase tracking-wider">ABOUT MODENA</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight mt-1">
          Culinary Philosophy & Craftsmanship
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Thoughtfully engineered kitchen essentials made for everyday Indian cooking.
        </p>
      </div>

      {/* Intro Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 mb-8 shadow-xs space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
          Built for Everyday Cooking
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
          Modena designs reliable cookware and kitchen appliances for home cooks and culinary enthusiasts. We focus on heavy-gauge construction, food-safe materials, and practical engineering so preparing daily meals is effortless and dependable.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (setCurrentView) setCurrentView('bestseller');
              window.location.hash = 'bestseller';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-[#C91F26] hover:bg-[#A8181E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
          >
            <span>EXPLORE PRODUCTS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (setCurrentView) setCurrentView('contactUs');
              window.location.hash = 'contactUs';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-white border border-gray-200 hover:border-gray-400 text-gray-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            CONTACT US
          </button>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="space-y-4 mb-10">
        <h3 className="text-lg font-bold text-gray-900">Craftsmanship &amp; Material Focus</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#C91F26] flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold block">{item.subtitle}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pt-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Specs Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs mb-10 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Design &amp; Engineering Choices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold text-[#C91F26]">Modena Build Standard</th>
                <th className="py-2.5 px-3 font-bold text-gray-600">Standard Market Build</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {engineeringSpecs.map((spec, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-gray-900">{spec.feature}</td>
                  <td className="py-3 px-3 font-bold text-[#C91F26] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C91F26] flex-shrink-0" />
                    <span>{spec.modena}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-500">{spec.standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200/80">
        <span className="text-xs text-gray-500">Have questions about our products or culinary philosophy?</span>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              if (setCurrentView) setCurrentView('contactUs');
              window.location.hash = 'contactUs';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none text-center"
          >
            Contact Support
          </button>
          <button
            onClick={() => {
              if (setCurrentView) setCurrentView('home');
              window.location.hash = '';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-[#C91F26] hover:bg-[#A8181E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none text-center shadow-xs"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Philosophy;
