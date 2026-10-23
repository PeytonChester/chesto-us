import oct11Small from '../assets/water-log/tank-2026-10-11-640.webp'
import oct11Large from '../assets/water-log/tank-2026-10-11-1280.webp'
import oct23Small from '../assets/water-log/tank-2026-10-23-640.webp'
import oct23Large from '../assets/water-log/tank-2026-10-23-1280.webp'

// Newest first. Add new photos to src/assets/water-log (640 and 1280px WebP).
const PHOTOS = [
  {
    date: '2026-10-23',
    small: oct23Small, large: oct23Large, width: 1280, height: 1459,
    alt: "Queso, a white betta, swimming above spiderwood and spotted anubias in a planted 10-gallon tank, with hornwort hanging from the surface",
  },
  {
    date: '2026-10-11',
    small: oct11Small, large: oct11Large, width: 1280, height: 1298,
    alt: "Queso's planted 10-gallon tank with spiderwood, newly tied-on anubias, Amazon swords and an aquarium thermometer, with Queso near the surface",
  },
]

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export default function TankPhotos() {
  return (
    <section className="mb-16">
      <h2 className="display-heading text-2xl md:text-3xl mb-6">Tank photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-start">
        {PHOTOS.map(p => (
          <figure key={p.date}>
            <img
              src={p.large}
              srcSet={`${p.small} 640w, ${p.large} 1280w`}
              sizes="(max-width: 768px) 50vw, (max-width: 1152px) 25vw, 270px"
              width={p.width}
              height={p.height}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="w-full h-auto bg-chesto-charcoal/5"
            />
            <figcaption className="mt-2 text-sm text-chesto-charcoal/50">
              <time dateTime={p.date}>{formatDate(p.date)}</time>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
