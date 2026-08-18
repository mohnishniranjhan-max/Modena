import React from 'react';
import {
  ArrowRight,
  UtensilsCrossed
} from 'lucide-react';
import { useRecipes } from '../../hooks/useRecipes';

const RecipesSection = ({ onSelectRecipe, onExploreRecipes }) => {
  const { recipes, isLoading } = useRecipes();

  // Display top 3-4 recipes on the homepage
  const displayedRecipes = recipes.slice(0, 3);

  if (!isLoading && displayedRecipes.length === 0) {
    return null;
  }

  return (
    <section className="py-14 sm:py-20 bg-[#FAF7F2] border-y border-[#EBE6DD] font-inter text-[#292725] relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EDE2] border border-[#E2D8C7] text-[#8C5A24] text-[11px] font-bold tracking-wider uppercase mb-3">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#8C5A24]" />
              <span>CULINARY JOURNAL &amp; GUIDES</span>
            </div>
            
            <h2 className="font-display-lg text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#292725] tracking-tight leading-tight">
              Recipes &amp; Cooking Guides
            </h2>
            
            <p className="text-sm text-[#716D67] mt-2 font-medium leading-relaxed max-w-xl">
              Authentic Indian recipes and time-tested culinary techniques crafted for heavy-gauge cast iron, tri-ply cookware, and high-torque grinding.
            </p>
          </div>

          {onExploreRecipes && recipes.length > 3 && (
            <button
              onClick={onExploreRecipes}
              className="inline-flex items-center gap-2 self-start md:self-end text-xs font-bold text-[#8C5A24] hover:text-[#C91F26] uppercase tracking-wider transition-colors cursor-pointer border-b border-[#8C5A24]/40 hover:border-[#C91F26] pb-1"
            >
              <span>Explore All Recipes ({recipes.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recipe Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-[#EBE6DD] p-4 h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {displayedRecipes.map((recipe) => (
              <article
                key={recipe.id}
                onClick={() => onSelectRecipe && onSelectRecipe(recipe)}
                className="bg-white rounded-3xl border border-[#EBE6DD] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer shadow-xs"
              >
                <div>
                  {/* Food Image Container */}
                  <div className="relative aspect-16/10 overflow-hidden bg-[#FAF7F2]">
                    {recipe.image && recipe.image.trim() !== '' ? (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <UtensilsCrossed className="w-10 h-10 stroke-[1.5]" />
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
        )}

      </div>
    </section>
  );
};

export default RecipesSection;
