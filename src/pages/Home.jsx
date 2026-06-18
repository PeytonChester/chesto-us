import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { usePhotographySettings } from '../hooks/usePhotographySettings'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import PageMeta from '../components/PageMeta'

export default function Home() {
  const { docs: recentRecipes } = useCollection('recipes', 'createdAt', 'desc')
  const { docs: recentPhotos } = useCollection('photos', 'createdAt', 'desc')
  const { docs: recentPosts } = useCollection('posts', 'createdAt', 'desc')
  const [heroSettings, setHeroSettings] = useState({ heroTagline: 'Welcome to the party', heroHeading: 'Photography.\nFood. Life.', heroImageUrl: '' })

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'home'), snap => {
      if (snap.exists()) setHeroSettings(snap.data())
    })
    return unsub
  }, [])

  const { categories, covers } = usePhotographySettings()

  const featuredRecipes = recentRecipes.slice(0, 3)
  const featuredPosts = recentPosts.slice(0, 3)

  const topCategories = categories
    .map(cat => ({ ...cat, count: recentPhotos.filter(p => p.category === cat.slug).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <div>
      <PageMeta
        description="Photography, recipes, and stories by Peyton Chester."
        image={heroSettings.heroImageUrl || undefined}
      />
      {/* Hero */}
      <section className="relative min-h-screen flex items-end pb-20 overflow-hidden">
        {/* Background — replace src with your hero image URL in Firestore or hardcode */}
        <div className="absolute inset-0 bg-chesto-dark">
          {heroSettings.heroImageUrl && (
            <img
              src={heroSettings.heroImageUrl}
              alt="Hero"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-chesto-dark via-chesto-dark/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full">
          {heroSettings.heroTagline && (
            <p className="section-label text-chesto-gold/80 mb-4">{heroSettings.heroTagline}</p>
          )}
          <h1 className="font-display font-semibold text-5xl md:text-7xl text-chesto-cream leading-[1.05] mb-8 max-w-2xl">
            {heroSettings.heroHeading?.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
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

        {topCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topCategories.map(cat => (
              <Link
                key={cat.slug}
                to={`/photography/${cat.slug}`}
                className="photo-card group"
                style={{ aspectRatio: '3/2' }}
              >
                {covers[cat.slug] ? (
                  <img src={covers[cat.slug]} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-stone-800 flex items-center justify-center">
                    <span className="text-white/20 text-xs tracking-widest uppercase">{cat.label}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-chesto-dark/60 hover:bg-chesto-dark/40 transition-all duration-400 flex flex-col justify-end p-6">
                  <p className="section-label text-chesto-gold mb-1">{cat.label}</p>
                  <p className="text-chesto-cream/70 text-sm font-body">{cat.description}</p>
                  <span className="mt-3 text-xs text-chesto-cream/50 tracking-widest uppercase group-hover:text-chesto-gold transition-colors duration-200">
                    View photos →
                  </span>
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

          <Link to="/recipes" className="inline-flex items-center gap-2 px-6 py-3 border border-chesto-cream/30 text-chesto-cream font-body font-medium text-sm tracking-wider uppercase hover:border-chesto-cream transition-all duration-200 mt-8 md:hidden">
            View All Recipes
          </Link>
        </div>
      </section>

      {/* Blog preview */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label mb-2">Latest writing</p>
            <h2 className="display-heading text-4xl">From the Blog</h2>
          </div>
          <Link to="/blog" className="btn-ghost hidden md:inline-flex">View All</Link>
        </div>

        {featuredPosts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {featuredPosts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                {post.imageUrl && (
                  <div className="aspect-photo overflow-hidden mb-5">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                )}
                <p className="section-label mb-1.5">{post.category}</p>
                <h3 className="font-display font-semibold text-xl text-chesto-dark mb-2 group-hover:text-chesto-gold transition-colors duration-200 leading-snug">{post.title}</h3>
                <p className="text-chesto-charcoal/60 text-sm font-body leading-relaxed line-clamp-2">{post.excerpt}</p>
                <p className="text-xs font-mono text-chesto-charcoal/30 mt-3">
                  {(post.publishedAt ?? post.createdAt)?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            Posts will appear here once added via the admin panel
          </div>
        )}

        <Link to="/blog" className="btn-ghost mt-8 md:hidden">View All Posts</Link>
      </section>
    </div>
  )
}
