import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Helmet } from 'react-helmet-async'
import DOMPurify from 'dompurify'
import { db } from '../firebase'
import PageMeta from '../components/PageMeta'

export default function ReviewDetail() {
  const { slug } = useParams()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [spoilersRevealed, setSpoilersRevealed] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'reviews'), where('slug', '==', slug), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const data = snap.docs[0].data()
        if (data.published !== false) setReview({ id: snap.docs[0].id, ...data })
      }
      setLoading(false)
    }
    fetch()
  }, [slug])

  if (loading) return (
    <div className="pt-16 max-w-4xl mx-auto px-6 md:px-10 py-24 animate-pulse space-y-6">
      <div className="h-4 bg-chesto-charcoal/10 w-24" />
      <div className="h-10 bg-chesto-charcoal/10 w-2/3" />
      <div className="h-64 bg-chesto-charcoal/10" />
    </div>
  )

  if (!review) return (
    <div className="pt-16 max-w-2xl mx-auto px-6 md:px-10 py-24 text-center">
      <p className="text-chesto-charcoal/40 text-sm tracking-widest uppercase">Review not found</p>
      <Link to="/reviews" className="btn-ghost mt-6 inline-flex">← Back to Reviews</Link>
    </div>
  )

  const reviewDate = (review.publishedAt ?? review.createdAt)?.toDate?.()
  const hasExternalRatings = review.imdbRating || review.rtRating || review.metacriticRating

  return (
    <article className="pt-16">
      <PageMeta
        title={`${review.title} (${review.year}) Review`}
        description={review.overview}
        image={review.backdrop || review.poster}
      />
      <Helmet>
        <meta property="og:type" content="article" />
        {reviewDate && <meta property="article:published_time" content={reviewDate.toISOString()} />}
      </Helmet>

      {/* Backdrop hero */}
      <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden bg-chesto-dark">
        {review.backdrop ? (
          <img src={review.backdrop} alt={review.title} className="w-full h-full object-cover opacity-40" />
        ) : review.poster ? (
          <img src={review.poster} alt={review.title} className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-chesto-dark via-chesto-dark/30 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10">
        {/* Poster + info row — overlaps the backdrop */}
        <div className="flex flex-col sm:flex-row gap-8 -mt-24 relative z-10 mb-14">
          {review.poster && (
            <div className="flex-shrink-0">
              <img
                src={review.poster}
                alt={review.title}
                className="w-36 md:w-48 h-64 md:h-80 object-cover shadow-2xl"
              />
            </div>
          )}

          <div className="flex flex-col justify-end pb-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono px-2 py-1 border border-chesto-gold/40 text-chesto-gold/80">
                {review.mediaType === 'tv' ? 'TV Series' : 'Film'}
              </span>
              {review.genres?.slice(0, 3).map(g => (
                <span key={g} className="text-xs font-mono px-2 py-1 border border-chesto-charcoal/20 text-chesto-charcoal/50">{g}</span>
              ))}
            </div>

            <h1 className="font-display font-semibold text-4xl md:text-5xl text-chesto-dark leading-tight mb-2">
              {review.title}
            </h1>

            <p className="text-chesto-charcoal/50 text-sm font-mono mb-4">
              {review.year}
              {review.runtime ? ` · ${review.runtime}` : ''}
              {review.director ? ` · Dir. ${review.director}` : ''}
              {review.creator ? ` · Created by ${review.creator}` : ''}
            </p>

            {/* My rating */}
            {review.userRating && (
              <div className="mb-4">
                <p className="text-chesto-charcoal/30 text-xs tracking-widest uppercase mb-1">My Rating</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-semibold text-6xl text-chesto-gold leading-none">{review.userRating}</span>
                  <span className="text-chesto-charcoal/30 text-lg font-mono">/10</span>
                </div>
              </div>
            )}

            {/* External ratings */}
            {hasExternalRatings && (
              <div className="flex gap-5 flex-wrap">
                {review.imdbRating && (
                  <div className="text-center">
                    <p className="text-chesto-charcoal/70 font-body font-semibold text-sm">{review.imdbRating}</p>
                    <p className="text-chesto-charcoal/30 text-xs font-mono">IMDB</p>
                  </div>
                )}
                {review.rtRating && (
                  <div className="text-center">
                    <p className="text-chesto-charcoal/70 font-body font-semibold text-sm">{review.rtRating}</p>
                    <p className="text-chesto-charcoal/30 text-xs font-mono">Rotten Tomatoes</p>
                  </div>
                )}
                {review.metacriticRating && (
                  <div className="text-center">
                    <p className="text-chesto-charcoal/70 font-body font-semibold text-sm">{review.metacriticRating}</p>
                    <p className="text-chesto-charcoal/30 text-xs font-mono">Metacritic</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        {review.overview && (
          <p className="text-chesto-charcoal/60 font-body text-base leading-relaxed max-w-2xl mb-14 italic">
            {review.overview}
          </p>
        )}

        {/* Review body + Cast side by side */}
        {(review.body || review.cast?.length > 0) && (
          <div className="flex flex-col md:flex-row md:items-start gap-12 mb-6">
            {/* Left column: review body + spoilers */}
            <div className="flex-1 min-w-0">
              {review.body && (
                <section className="mb-6">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-chesto-charcoal/40 text-xs tracking-widest uppercase">My Review</h2>
                    {reviewDate && (
                      <span className="text-chesto-charcoal/30 text-xs font-mono">
                        {reviewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div
                    className="prose-chesto"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        Array.isArray(review.body)
                          ? review.body.map(p => `<p>${p}</p>`).join('')
                          : review.body || ''
                      )
                    }}
                  />
                </section>
              )}

              {/* Spoilers */}
              {review.spoilers && (
                <section className="mb-14">
                  <div className="border-t border-chesto-charcoal/10 mb-10" />
                  <h2 className="text-chesto-charcoal/40 text-xs tracking-widest uppercase mb-6">Spoiler Review</h2>
                  {spoilersRevealed ? (
                    <div
                      className="prose-chesto"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(review.spoilers)
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => setSpoilersRevealed(true)}
                      className="w-full border border-chesto-charcoal/15 py-5 px-6 text-center group hover:border-chesto-gold/40 transition-colors"
                    >
                      <span className="text-chesto-charcoal/40 text-xs tracking-widest uppercase group-hover:text-chesto-gold transition-colors">
                        Reveal Spoilers
                      </span>
                    </button>
                  )}
                </section>
              )}
            </div>

            {/* Cast */}
            {review.cast?.length > 0 && (
              <section className="w-full md:w-52 flex-shrink-0">
                <h2 className="text-chesto-charcoal/40 text-xs tracking-widest uppercase mb-6">Cast</h2>
                <div className="grid grid-cols-2 gap-4">
                  {review.cast.map((member, i) => (
                    <div key={i} className="text-center">
                      <div className="w-full aspect-square rounded-full overflow-hidden bg-chesto-charcoal/10 mb-2">
                        {member.profilePath ? (
                          <img src={member.profilePath} alt={member.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-chesto-charcoal/20 text-xs font-mono">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="text-chesto-dark text-xs font-body font-medium leading-tight line-clamp-1">{member.name}</p>
                      <p className="text-chesto-charcoal/30 text-xs font-body line-clamp-1">{member.character}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <Link to="/reviews" className="section-label text-chesto-charcoal/40 hover:text-chesto-gold transition-colors inline-block mb-24">
          ← All Reviews
        </Link>
      </div>
    </article>
  )
}
