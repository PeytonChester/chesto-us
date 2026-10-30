import { useState } from 'react'
import Lightbox from './Lightbox'
import { responsiveImage } from '../lib/images'
import { allPhotos } from '../lib/waterLog'

const SIZES = '(max-width: 768px) 50vw, (max-width: 1152px) 25vw, 270px'

const imgProps = p => p.small
  ? { src: p.small, srcSet: `${p.small} 640w, ${p.url} ${p.width}w`, sizes: SIZES }
  : responsiveImage(p.url, SIZES, { maxWidth: 1080 })

// Bundled photos plus the ones uploaded in Admin -> Water Log (`uploaded`)
export default function TankPhotos({ uploaded = [] }) {
  const [open, setOpen] = useState(null)
  const photos = allPhotos(uploaded)

  return (
    <section className="mt-16">
      <h2 className="display-heading text-2xl md:text-3xl mb-6">Tank photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {photos.map((p, i) => (
          <figure key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="block w-full aspect-square overflow-hidden bg-chesto-charcoal/5 cursor-zoom-in"
              aria-label={`Open the ${p.title} photo`}
            >
              <img
                {...imgProps(p)}
                width="640"
                height="640"
                alt={p.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </button>
            <figcaption className="mt-2 text-sm text-chesto-charcoal/50">
              <time dateTime={p.date}>{p.title}</time>
            </figcaption>
          </figure>
        ))}
      </div>

      {open !== null && (
        <Lightbox photos={photos} index={open} label="Queso's tank" onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  )
}
