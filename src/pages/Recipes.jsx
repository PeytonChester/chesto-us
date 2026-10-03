import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import PageMeta from '../components/PageMeta'
import { responsiveImage } from '../lib/images'

// Display order for filters; only categories that have recipes are shown
const CATEGORY_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink']

export default function Recipes() {
  const { docs: recipes, loading } = useCollection('recipes', 'createdAt', 'desc')
  const [active, setActive] = useState('All')

  const published = recipes.filter(r => r.published !== false)
  const present = new Set(published.map(r => r.category).filter(Boolean))
  const categories = [
    ...CATEGORY_ORDER.filter(c => present.has(c)),
    ...[...present].filter(c => !CATEGORY_ORDER.includes(c)).sort(),
  ]
  const filtered = active === 'All' ? published : published.filter(r => r.category === active)

  return (
    <div className="pt-16">
      <PageMeta title="Recipes" description="Recipes from the kitchen — breakfasts, dinners, desserts, and more." />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="section-label mb-3">From the kitchen</p>
        <h1 className="display-heading text-5xl md:text-7xl mb-10">Recipes</h1>

        {/* Filter bar (only worth showing with more than one category) */}
        {categories.length > 1 && <div className="flex flex-wrap gap-2 mb-14">
          {['All', ...categories].map(cat => (
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
        </div>}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-chesto-charcoal/10">
                <div className="aspect-photo bg-chesto-charcoal/10" />
                <div className="p-6">
                  <div className="h-3 bg-chesto-charcoal/10 w-16 mb-3" />
                  <div className="h-5 bg-chesto-charcoal/10 w-3/4 mb-3" />
                  <div className="h-3 bg-chesto-charcoal/10 w-full mb-2" />
                  <div className="h-3 bg-chesto-charcoal/10 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            No recipes yet — check back soon
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map(recipe => (
              <Link key={recipe.id} to={`/recipes/${recipe.slug}`} className="group content-card">
                <div className="content-card-media">
                  {recipe.imageUrl ? (
                    <img {...responsiveImage(recipe.imageUrl, '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw')} loading="lazy" alt={recipe.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-chesto-charcoal/20 text-xs tracking-widest uppercase">No Image</span>
                    </div>
                  )}
                </div>
                <div className="content-card-body">
                  <p className="section-label mb-2">{recipe.category || 'Recipe'}</p>
                  <h2 className="font-display font-semibold text-2xl text-chesto-dark mb-2 group-hover:text-chesto-gold transition-colors duration-200 leading-snug">
                    {recipe.title}
                  </h2>
                  {recipe.excerpt && (
                    <p className="text-chesto-charcoal/60 text-sm font-body leading-relaxed line-clamp-3 mb-5">{recipe.excerpt}</p>
                  )}
                  {(recipe.prepTime || recipe.cookTime) && (
                    <div className="content-card-meta">
                      {recipe.prepTime && <span>Prep {recipe.prepTime}</span>}
                      {recipe.cookTime && <span>Cook {recipe.cookTime}</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
