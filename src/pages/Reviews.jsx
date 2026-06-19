import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import PageMeta from '../components/PageMeta'

const FILTERS = ['All', 'Film', 'TV']

export default function Reviews() {
  const { docs: allReviews, loading } = useCollection('reviews', 'publishedAt', 'desc')
  const [filter, setFilter] = useState('All')

  const reviews = allReviews.filter(r => {
    if (r.published === false) return false
    if (filter === 'Film') return r.mediaType === 'movie'
    if (filter === 'TV') return r.mediaType === 'tv'
    return true
  })

  return (
    <div className="pt-16">
      <PageMeta
        title="Movie & TV Reviews"
        description="Peyton's reviews of movies and TV shows — with ratings, cast, and honest takes."
      />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="section-label mb-3">Watching</p>
        <h1 className="display-heading text-5xl md:text-7xl mb-10">Movie &amp; TV Reviews</h1>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-12 border-b border-chesto-charcoal/10">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 text-xs font-body font-medium tracking-widest uppercase transition-colors border-b-2 -mb-px ${
                filter === f
                  ? 'border-chesto-gold text-chesto-dark'
                  : 'border-transparent text-chesto-charcoal/40 hover:text-chesto-dark'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-chesto-charcoal/10 mb-3" />
                <div className="h-3 bg-chesto-charcoal/10 w-3/4 mb-1.5" />
                <div className="h-3 bg-chesto-charcoal/10 w-1/2" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            No reviews yet
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {reviews.map(review => (
              <Link key={review.id} to={`/reviews/${review.slug}`} className="group">
                <div className="aspect-[2/3] overflow-hidden bg-chesto-charcoal/10 mb-3 relative">
                  {review.poster ? (
                    <img
                      src={review.poster}
                      alt={review.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-chesto-charcoal/20">
                      <span className="text-chesto-charcoal/30 text-xs tracking-widest uppercase">{review.mediaType === 'tv' ? 'TV' : 'Film'}</span>
                    </div>
                  )}
                  {review.userRating && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                      <span className="text-chesto-gold font-display font-semibold text-sm">{review.userRating}</span>
                      <span className="text-white/40 text-xs font-mono">/10</span>
                    </div>
                  )}
                </div>
                <p className="text-chesto-dark font-body font-medium text-sm leading-snug group-hover:text-chesto-gold transition-colors duration-200 line-clamp-2 mb-1">
                  {review.title}
                </p>
                <p className="text-chesto-charcoal/40 text-xs font-mono">
                  {review.year}
                  {' · '}
                  <span>{review.mediaType === 'tv' ? 'TV' : 'Film'}</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
