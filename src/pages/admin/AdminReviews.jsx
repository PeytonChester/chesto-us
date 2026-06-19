import { Link } from 'react-router-dom'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'

export default function AdminReviews() {
  const { docs: reviews, loading } = useCollection('reviews', 'publishedAt', 'desc')

  const handleDelete = async (review) => {
    if (!window.confirm(`Delete review for "${review.title}"?`)) return
    await deleteDoc(doc(db, 'reviews', review.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-1">Reviews</h1>
          <p className="text-chesto-cream/40 text-sm">{reviews.length} reviews</p>
        </div>
        <Link to="/admin/reviews/new" className="btn-gold">+ New Review</Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-chesto-charcoal/20 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-4 border border-chesto-cream/10">
          <p className="text-chesto-cream/20 text-sm tracking-wider">No reviews yet</p>
          <Link to="/admin/reviews/new" className="btn-gold text-xs">Write your first review</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map(review => (
            <div key={review.id} className="flex items-center gap-4 bg-chesto-charcoal/20 px-4 py-3 group hover:bg-chesto-charcoal/30 transition-colors">
              {review.poster && (
                <img src={review.poster} alt={review.title} className="w-8 h-12 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-chesto-cream font-body font-medium truncate">{review.title}</p>
                  <span className="flex-shrink-0 text-xs font-mono px-1.5 py-0.5 border border-chesto-cream/10 text-chesto-cream/30">
                    {review.mediaType === 'tv' ? 'TV' : 'Film'}
                  </span>
                  {review.published === false && (
                    <span className="flex-shrink-0 text-xs font-mono px-1.5 py-0.5 border border-chesto-cream/20 text-chesto-cream/40">Draft</span>
                  )}
                </div>
                <p className="text-chesto-cream/40 text-xs">
                  {review.year}{review.userRating ? ` · ${review.userRating}/10` : ''}
                </p>
              </div>
              <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Link to={`/admin/reviews/${review.id}/edit`} className="text-xs text-chesto-gold hover:text-chesto-gold-light px-3 py-1.5 border border-chesto-gold/30 hover:border-chesto-gold transition-colors">
                  Edit
                </Link>
                <button onClick={() => handleDelete(review)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 hover:border-red-400 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
