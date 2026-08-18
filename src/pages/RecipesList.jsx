import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  ChefHat,
  Search
} from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';

const RecipesList = ({ setCurrentView, onSelectRecipe }) => {
  const { recipes, isLoading } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (r.title || '').toLowerCase().includes(q) ||
        (r.excerpt || '').toLowerCase().includes(q)
      );
    });
  }, [recipes, searchQuery]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300 font-inter text-[#292725]">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-8 border-b border-[#EBE6DD] pb-4">
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
          <span className="text-[#8C5A24] font-semibold">Recipes &amp; Cooking Guides</span>
        </div>
      </div>

      {/* Header */}
      <header className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EDE2] border border-[#E2D8C7] text-[#8C5A24] text-[11px] font-bold tracking-wider uppercase mb-3">
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#8C5A24]" />
          <span>MODENA CULINARY JOURNAL</span>
        </div>

        <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#292725] tracking-tight mb-3">
          Recipes &amp; Cooking Guides
        </h1>

        <p className="text-sm sm:text-base text-[#716D67] font-medium leading-relaxed mb-6">
          Authentic kitchen recipes and step-by-step guides crafted for Modena cookware and high-performance appliances.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes & cooking guides..."
            className="w-full bg-[#FAF7F2] border border-[#EBE6DD] rounded-full pl-9 pr-4 py-2.5 text-xs text-[#292725] focus:outline-none focus:border-[#8C5A24] transition-colors shadow-xs"
          />
        </div>
      </header>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-[#FAF7F2] rounded-3xl border border-[#EBE6DD] p-4 h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredRecipes.map((recipe) => (
            <article
              key={recipe.id}
              onClick={() => onSelectRecipe && onSelectRecipe(recipe)}
              className="bg-white rounded-3xl border border-[#EBE6DD] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer shadow-xs"
            >
              <div>
                {/* Food Image Container */}
                <div className="relative aspect-16/10 overflow-hidden bg-[#FAF7F2]">
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <UtensilsCrossed className="w-12 h-12 stroke-[1.5]" />
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-6">
                  {/* Recipe Title */}
                  <h3 className="font-bold text-base text-[#292725] group-hover:text-[#C91F26] transition-colors leading-snug line-clamp-2 mb-2">
                    {recipe.title}
                  </h3>

                  {/* Short Excerpt */}
                  {recipe.excerpt && (
                    <p className="text-xs text-[#716D67] line-clamp-3 leading-relaxed font-normal">
                      {recipe.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Action */}
              <div className="px-6 pb-6 pt-2">
                <div className="pt-4 border-t border-[#EBE6DD] flex items-center justify-between">
                  <span className="text-xs text-[#716D67] font-semibold">
                    {recipe.instructions?.length ? `${recipe.instructions.length} Steps` : 'Cooking Guide'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C5A24] group-hover:text-[#C91F26] transition-colors">
                    <span>View Recipe</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#FAF7F2] rounded-3xl border border-[#EBE6DD]">
          <ChefHat className="w-10 h-10 text-[#8C5A24] mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-base text-[#292725] mb-1">No recipes found</h3>
          <p className="text-xs text-[#716D67] mb-4">Try clearing your search term to see all recipes.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-[#8C5A24] underline hover:text-[#C91F26] cursor-pointer"
          >
            Show All Recipes
          </button>
        </div>
      )}

    </div>
  );
};

export default RecipesList;
