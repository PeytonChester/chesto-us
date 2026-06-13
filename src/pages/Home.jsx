import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'

export default function Home() {
  const { docs: recentRecipes } = useCollection('recipes', 'createdAt', 'desc')
  const { docs: recentPhotos } = useCollection('photos', 'createdAt', 'desc')

  const featuredRecipes = recentRecipes.slice(0, 3)
  const featuredPhotos = recentPhotos.slice(0, 6)

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-end pb-20 overflow-hidden">
        {/* Background — replace src with your hero image URL in Firestore or hardcode */}
        <div className="absolute inset-0 bg-chesto-dark">
          <img
            src="https://chesto.us/wp-content/uploads/2025/07/GPTempDownload-edited-scaled.jpeg"
            alt="Hero"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-chesto-dark via-chesto-dark/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full">
          <p className="section-label text-chesto-gold/80 mb-4">Welcome to the party</p>
          <h1 className="font-display font-semibold text-5xl md:text-7xl text-chesto-cream leading-[1.05] mb-8 max-w-2xl">
            Photography.<br />Food. Life.
          </h1>
          <div className="flex flex-wrap gap-4">
            <Link to="/photography" className="btn-gold">View Photography</Link>
            <Link to="/recipes" className="inline-flex items-center gap-2 px-6 py-3 border border-chesto-cream/30 text-chesto-cream font-body font-medium text-sm tracking-wider uppercase hover:border-chesto-cream hover:bg-chesto-cream/10 transition-all duration-200">
              Browse Recipes
            </Link>
          </div>
        </div>
      </section>

      {/* Photography preview */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label mb-2">Captured moments</p>
            <h2 className="display-heading text-4xl">Photography</h2>
          </div>
          <Link to="/photography" className="btn-ghost hidden md:inline-flex">View All</Link>
        </div>

        {featuredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {featuredPhotos.map((photo, i) => (
              <Link
                key={photo.id}
                to={`/photography/${photo.category}`}
                className={`photo-card ${i === 0 ? 'row-span-2' : ''}`}
                style={{ aspectRatio: i === 0 ? '3/4' : '3/2' }}
              >
                <img src={photo.url} alt={photo.title || photo.category} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                <div className="photo-card-overlay">
                  <span className="text-xs text-chesto-cream font-body tracking-widest uppercase opacity-0 group-hover:opacity-100">{photo.category}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            Photos will appear here once added via the admin panel
          </div>
        )}

        <Link to="/photography" className="btn-ghost mt-8 md:hidden">View All Photography</Link>
      </section>

      {/* Recipes preview */}
      <section className="bg-chesto-dark py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label text-chesto-gold/80 mb-2">From the kitchen</p>
              <h2 className="font-display font-semibold text-4xl text-chesto-cream">Recipes</h2>
            </div>
            <Link to="/recipes" className="inline-flex items-center gap-2 px-6 py-3 border border-chesto-cream/30 text-chesto-cream font-body font-medium text-sm tracking-wider uppercase hover:border-chesto-cream transition-all duration-200 hidden md:inline-flex">
              View All
            </Link>
          </div>

          {featuredRecipes.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredRecipes.map(recipe => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.slug}`}
                  className="group"
                >
                  <div className="aspect-photo overflow-hidden mb-5">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-chesto-charcoal flex items-center justify-center">
                        <span className="text-chesto-cream/20 text-xs tracking-widest uppercase">No Image</span>
                      </div>
                    )}
                  </div>
                  <p className="section-label text-chesto-gold/70 mb-1.5">{recipe.category || 'Recipe'}</p>
                  <h3 className="font-display font-semibold text-xl text-chesto-cream mb-2 group-hover:text-chesto-gold transition-colors duration-200">{recipe.title}</h3>
                  <p className="text-chesto-cream/50 text-sm font-body leading-relaxed line-clamp-2">{recipe.excerpt}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-chesto-cream/10 text-chesto-cream/20 text-sm tracking-wider">
              Recipes will appear here once added via the admin panel
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
