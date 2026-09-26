import { useState } from 'react'
import Masonry from 'react-masonry-css'
import Lightbox from './Lightbox'

const BREAKPOINTS = { default: 3, 1100: 2, 640: 1 }

// Masonry grid with "Load More" paging and a fullscreen lightbox.
export default function PhotoGallery({ photos, label, breakpoints = BREAKPOINTS, pageSize = 10 }) {
  const [lightbox, setLightbox] = useState(null)
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const visiblePhotos = photos.slice(0, visibleCount)

  return (
    <>
      <Masonry breakpointCols={breakpoints} className="masonry-grid" columnClassName="masonry-grid-column">
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
            onClick={() => setVisibleCount(c => c + pageSize)}
            className="btn-ghost"
          >
            Load More
          </button>
        </div>
      )}

    {lightbox !== null && photos[lightbox] && (
      <Lightbox
        photos={photos}
        index={lightbox}
        label={label}
        onIndexChange={setLightbox}
        onClose={() => setLightbox(null)}
      />
    )}
    </>
  )
}
