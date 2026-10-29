import { useState } from 'react'
import Lightbox from './Lightbox'
import { responsiveImage } from '../lib/images'
import oct11Small from '../assets/water-log/tank-2026-10-11-640.webp'
import oct11Full from '../assets/water-log/tank-2026-10-11-full.webp'
import oct23Small from '../assets/water-log/tank-2026-10-23-640.webp'
import oct23Full from '../assets/water-log/tank-2026-10-23-full.webp'
import oct29Small from '../assets/water-log/tank-2026-10-29-640.webp'
import oct29Full from '../assets/water-log/tank-2026-10-29-full.webp'

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

// Photos bundled with the site. New ones are uploaded in Admin -> Water Log
// and arrive through the `uploaded` prop (settings/waterLog photos).
const BUNDLED = [
  {
    date: '2026-10-29', small: oct29Small, url: oct29Full, width: 1929,
    alt: 'Queso, a white betta, at the left of a planted 10-gallon tank with spiderwood, anubias and Amazon swords, under a thick mat of hornwort and floating plants',
  },
  {
    date: '2026-10-23', small: oct23Small, url: oct23Full, width: 1942,
    alt: 'Queso, a white betta, swimming above spiderwood and spotted anubias in a planted 10-gallon tank, with hornwort hanging from the surface',
  },
  {
    date: '2026-10-11', small: oct11Small, url: oct11Full, width: 1966,
    alt: "Queso's planted 10-gallon tank with spiderwood, newly tied-on anubias, Amazon swords and an aquarium thermometer, with Queso near the surface",
  },
].map(p => ({ ...p, id: p.date, thumb: p.small }))

const SIZES = '(max-width: 768px) 50vw, (max-width: 1152px) 25vw, 270px'

const imgProps = p => p.small
  ? { src: p.small, srcSet: `${p.small} 640w, ${p.url} ${p.width}w`, sizes: SIZES }
  : responsiveImage(p.url, SIZES, { maxWidth: 1080 })

export default function TankPhotos({ uploaded = [] }) {
  const [open, setOpen] = useState(null)
  const fallbackAlt = date => `Queso's planted 10-gallon tank on ${formatDate(date)}`
  const photos = [...uploaded, ...BUNDLED]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(p => ({ ...p, title: formatDate(p.date), alt: p.alt || fallbackAlt(p.date) }))

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
