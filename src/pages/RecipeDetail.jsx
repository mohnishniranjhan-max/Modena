import React, { useEffect } from 'react';
import {
  ArrowLeft,
  CookingPot,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const RecipeDetail = ({ recipe, onBack, setCurrentView, onSelectProduct, allProducts }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [recipe]);

  // Find matching product in allProducts if available, or use the populated recommended_product object
  const recProduct = recipe?.recommended_product;
  const matchedProduct = React.useMemo(() => {
    if (!recProduct || !allProducts || allProducts.length === 0) return null;
    return allProducts.find((p) => p.id === recProduct.id || (p.slug && p.slug === recProduct.slug));
  }, [recProduct, allProducts]);

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Recipe not found.</p>
        <button
          onClick={onBack}
          className="text-xs font-bold text-[#C91F26] underline hover:text-[#A9181E] cursor-pointer"
        >
          Back to Recipes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300 font-inter text-[#292725]">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-8 border-b border-[#EBE6DD] pb-4">
        <button
          onClick={onBack}
          className="hover:text-[#C91F26] cursor-pointer flex items-center gap-2 text-xs font-semibold text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recipes</span>
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
          <button
            onClick={onBack}
            className="hover:text-gray-600 cursor-pointer"
          >
            Recipes
          </button>
          <span>›</span>
          <span className="text-[#8C5A24] font-semibold truncate max-w-[200px]">{recipe.title}</span>
        </div>
      </div>

      {/* 1. Recipe Title */}
      <header className="mb-8">
        <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#292725] tracking-tight leading-tight mb-4">
          {recipe.title}
        </h1>
        {recipe.excerpt && (
          <p className="text-base sm:text-lg text-[#514C48] font-normal leading-relaxed">
            {recipe.excerpt}
          </p>
        )}
      </header>

      {/* 2. WordPress Recipe Image (from Media Library) */}
      {recipe.image && (
        <div className="rounded-3xl overflow-hidden mb-10 aspect-16/9 sm:aspect-21/9 bg-[#FAF7F2] border border-[#EBE6DD] shadow-sm">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 3. Ingredients & Instructions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left Column: Ingredients */}
        <div className="lg:col-span-4">
          <div className="bg-[#FAF7F2] border border-[#EBE6DD] rounded-3xl p-6 sm:p-7 sticky top-28">
            <h2 className="font-display-lg text-lg font-extrabold text-[#292725] mb-4 pb-3 border-b border-[#EBE6DD] flex items-center justify-between">
              <span>Ingredients</span>
              {recipe.ingredients?.length > 0 && (
                <span className="text-xs text-[#8C5A24] font-medium font-inter">({recipe.ingredients.length})</span>
              )}
            </h2>

            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <ul className="space-y-3 text-xs sm:text-sm text-[#514C48]">
                {recipe.ingredients.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-[#8C5A24] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">Ingredients list will be updated soon.</p>
            )}
          </div>
        </div>

        {/* Right Column: Step-by-Step Cooking Instructions */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="font-display-lg text-xl font-extrabold text-[#292725] pb-3 border-b border-[#EBE6DD]">
            Step-by-Step Cooking Instructions
          </h2>

          {recipe.instructions && recipe.instructions.length > 0 ? (
            <div className="space-y-4">
              {recipe.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#EBE6DD] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 hover:border-[#8C5A24]/40 transition-colors shadow-xs"
                >
                  <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#F3EDE2] text-[#8C5A24] font-extrabold text-xs tracking-wider uppercase shrink-0 self-start">
                    Step {idx + 1}
                  </div>
                  <div className="text-xs sm:text-sm text-[#292725] leading-relaxed flex-1 pt-0.5">
                    {step.replace(/^(Step\s*\d+[:.]?\s*|\d+[\.)]\s*)/i, '')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Instructions will be updated soon.</p>
          )}
        </div>

      </div>

      {/* 4. Recommended Modena Cookware / Appliance */}
      {recProduct && (
        <div className="bg-[#FAF7F2] border border-[#EBE6DD] rounded-3xl p-6 sm:p-8 mt-10">
          <div className="flex items-center gap-2 text-[#8C5A24] font-bold text-xs uppercase tracking-wider mb-4">
            <CookingPot className="w-4 h-4" />
            <span>Recommended Modena Cookware / Appliance</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE7E1] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {recProduct.image && (
                <img
                  src={recProduct.image}
                  alt={recProduct.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-[#F8F7F4] p-1.5 border border-[#EBE6DD] shrink-0"
                />
              )}
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#292725]">
                  {recProduct.name}
                </h3>
                {recProduct.price && (
                  <p className="text-xs font-extrabold text-[#C91F26] mt-0.5">
                    ₹{parseFloat(recProduct.price).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0 flex justify-end">
              {matchedProduct && onSelectProduct ? (
                <button
                  onClick={() => onSelectProduct(matchedProduct)}
                  className="w-full sm:w-auto bg-[#C91F26] hover:bg-[#A9181E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Product</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : recProduct.permalink ? (
                <a
                  href={recProduct.permalink}
                  className="w-full sm:w-auto bg-[#C91F26] hover:bg-[#A9181E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>View Product</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecipeDetail;
