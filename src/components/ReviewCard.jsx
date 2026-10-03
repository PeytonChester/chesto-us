import { Link } from 'react-router-dom'
import { tmdbImage } from '../lib/tmdb'

/** Poster card for a movie/TV review: poster, score overlay, title, year · type */
export default function ReviewCard({ review, sizes }) {
  const kind = review.mediaType === 'tv' ? 'TV' : 'Film'
  return (
    <Link to={`/reviews/${review.slug}`} className="group">
      <div className="aspect-[2/3] overflow-hidden bg-chesto-charcoal/10 mb-3 relative">
        {review.poster ? (
          <img
            {...tmdbImage(review.poster, 'poster', sizes, { maxWidth: 500 })}
            loading="lazy"
            alt={review.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-chesto-charcoal/20">
            <span className="text-chesto-charcoal/30 text-xs tracking-widest uppercase">{kind}</span>
          </div>
        )}
        {review.userRating && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pt-10 pb-2.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
            <span className="text-chesto-gold font-display font-semibold text-sm">{review.userRating}</span>
            <span className="text-white/70 text-xs font-mono">/10</span>
          </div>
        )}
      </div>
      <p className="text-chesto-dark font-body font-medium text-sm leading-snug group-hover:text-chesto-gold transition-colors duration-200 line-clamp-2 mb-1">
        {review.title}
      </p>
      <p className="text-chesto-charcoal/40 text-xs font-mono">
        {review.year}
        {' · '}
        <span>{kind}</span>
      </p>
    </Link>
  )
}
