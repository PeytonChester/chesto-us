import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink']

export default function Recipes() {
  const { docs: recipes, loading } = useCollection('recipes', 'createdAt', 'desc')
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? recipes : recipes.filter(r => r.category === active)

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="section-label mb-3">From the kitchen</p>
        <h1 className="display-heading text-5xl md:text-7xl mb-10">Recipes</h1>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-14">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-2 text-xs font-body font-medium tracking-widest uppercase transition-all duration-200 ${
                active === cat
                  ? 'bg-chesto-dark text-chesto-cream'
                  : 'border border-chesto-charcoal/20 text-chesto-charcoal/60 hover:border-chesto-dark hover:text-chesto-dark'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-photo bg-chesto-charcoal/10 mb-4" />
                <div className="h-3 bg-chesto-charcoal/10 w-16 mb-3" />
                <div className="h-5 bg-chesto-charcoal/10 w-3/4 mb-2" />
                <div className="h-3 bg-chesto-charcoal/10 w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            No recipes yet — add some in the admin panel
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {filtered.map(recipe => (
              <Link key={recipe.id} to={`/recipes/${recipe.slug}`} className="group">
                <div className="aspect-photo overflow-hidden mb-5">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-chesto-charcoal/10 flex items-center justify-center">
                      <span className="text-chesto-charcoal/20 text-xs tracking-widest uppercase">No Image</span>
                    </div>
                  )}
                </div>
                <p className="section-label mb-1.5">{recipe.category || 'Recipe'}</p>
                <h2 className="font-display font-semibold text-2xl text-chesto-dark mb-2 group-hover:text-chesto-gold transition-colors duration-200 leading-snug">
                  {recipe.title}
                </h2>
                <p className="text-chesto-charcoal/60 text-sm font-body leading-relaxed line-clamp-2">{recipe.excerpt}</p>
                {(recipe.prepTime || recipe.cookTime) && (
                  <div className="flex gap-4 mt-3 text-xs text-chesto-charcoal/40 font-mono">
                    {recipe.prepTime && <span>Prep {recipe.prepTime}</span>}
                    {recipe.cookTime && <span>Cook {recipe.cookTime}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
