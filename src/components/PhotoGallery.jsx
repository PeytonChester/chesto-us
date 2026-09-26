import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Masonry from 'react-masonry-css'

const BREAKPOINTS = { default: 3, 1100: 2, 640: 1 }

// Masonry grid with "Load More" paging and a fullscreen lightbox.
export default function PhotoGallery({ photos, label }) {
  const [lightbox, setLightbox] = useState(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const thumbStripRef = useRef(null)
  const activeThumbRef = useRef(null)

  useEffect(() => {
    if (lightbox !== null && activeThumbRef.current && thumbStripRef.current) {
      activeThumbRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [lightbox])

  useEffect(() => {
    const handleKey = (e) => {
      if (lightbox === null) return
      if (e.key === 'ArrowRight') setLightbox(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft')  setLightbox(i => Math.max(i - 1, 0))
      if (e.key === 'Escape')     setLightbox(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightbox, photos.length])

  const visiblePhotos = photos.slice(0, visibleCount)

  return (
    <>
      <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-grid-column">
        {visiblePhotos.map((photo, i) => (
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

      {visibleCount < photos.length && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setVisibleCount(c => c + 10)}
            className="btn-ghost"
          >
            Load More
          </button>
        </div>
      )}

    {/* Lightbox */}
    {lightbox !== null && photos[lightbox] && createPortal(
      <div
        className="lightbox"
        onClick={() => setLightbox(null)}
      >
        <button
          className="absolute top-5 right-5 text-chesto-cream/60 hover:text-chesto-cream text-3xl leading-none z-10 p-3"
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

        {/* Bottom bar: caption + thumbnails */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-chesto-dark to-transparent pt-12 pb-4 px-4" onClick={e => e.stopPropagation()}>
          {photos[lightbox].title && (
            <p className="text-chesto-cream/70 text-sm font-body text-center mb-3">{photos[lightbox].title}</p>
          )}
          <div ref={thumbStripRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-start px-2">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                ref={i === lightbox ? activeThumbRef : null}
                onClick={() => setLightbox(i)}
                className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 overflow-hidden transition-all duration-200 ${
                  i === lightbox
                    ? 'ring-2 ring-chesto-gold opacity-100'
                    : 'opacity-40 hover:opacity-70'
                }`}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <p className="text-chesto-cream/30 text-xs font-mono text-right mt-2 pr-2">
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
