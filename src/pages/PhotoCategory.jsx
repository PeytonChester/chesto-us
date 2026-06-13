import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Masonry from 'react-masonry-css'
import { useCollection } from '../hooks/useCollection'

const BREAKPOINTS = { default: 3, 1100: 2, 640: 1 }

export default function PhotoCategory() {
  const { category } = useParams()
  const { docs: allPhotos, loading } = useCollection('photos', 'createdAt', 'desc')
  const [lightbox, setLightbox] = useState(null) // index or null

  const photos = allPhotos.filter(p => p.category === category)
  const label = category.charAt(0).toUpperCase() + category.slice(1)

  // Keyboard nav for lightbox
  const handleKey = (e) => {
    if (lightbox === null) return
    if (e.key === 'ArrowRight') setLightbox(i => Math.min(i + 1, photos.length - 1))
    if (e.key === 'ArrowLeft')  setLightbox(i => Math.max(i - 1, 0))
    if (e.key === 'Escape')     setLightbox(null)
  }

  return (
    <div className="pt-16" onKeyDown={handleKey} tabIndex={-1}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <Link to="/photography" className="section-label text-chesto-charcoal/50 hover:text-chesto-gold transition-colors mb-4 inline-block">
          ← Photography
        </Link>
        <h1 className="display-heading text-5xl md:text-6xl">{label}</h1>
        <p className="text-chesto-charcoal/50 mt-2 font-body">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-photo bg-chesto-charcoal/10 animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 border border-chesto-charcoal/10">
            <p className="text-chesto-charcoal/30 text-sm tracking-wider">No photos in this category yet</p>
            <Link to="/admin/photos" className="btn-ghost text-xs">Add Photos</Link>
          </div>
        ) : (
          <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-grid-column">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="photo-card cursor-zoom-in"
                onClick={() => setLightbox(i)}
              >
                <img
                  src={photo.url}
                  alt={photo.title || label}
                  className="w-full block transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
                {photo.title && (
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-chesto-dark/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-chesto-cream text-sm font-body">{photo.title}</p>
                  </div>
                )}
              </div>
            ))}
          </Masonry>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 text-chesto-cream/60 hover:text-chesto-cream text-3xl leading-none z-10"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >×</button>

          {/* Prev */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-chesto-cream/60 hover:text-chesto-cream text-4xl leading-none z-10 p-4"
              onClick={e => { e.stopPropagation(); setLightbox(i => i - 1) }}
              aria-label="Previous photo"
            >‹</button>
          )}

          {/* Image */}
          <img
            src={photos[lightbox].url}
            alt={photos[lightbox].title || label}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {lightbox < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-chesto-cream/60 hover:text-chesto-cream text-4xl leading-none z-10 p-4"
              onClick={e => { e.stopPropagation(); setLightbox(i => i + 1) }}
              aria-label="Next photo"
            >›</button>
          )}

          {/* Caption */}
          {photos[lightbox].title && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
              <p className="text-chesto-cream/70 text-sm font-body">{photos[lightbox].title}</p>
            </div>
          )}

          <p className="absolute bottom-6 right-6 text-chesto-cream/30 text-xs font-mono">
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  )
}
