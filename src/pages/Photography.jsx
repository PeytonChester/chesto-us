import { Link } from 'react-router-dom'
import { usePhotographySettings } from '../hooks/usePhotographySettings'

export default function Photography() {
  const { categories, covers } = usePhotographySettings()

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="section-label mb-3">Visual work</p>
        <h1 className="display-heading text-5xl md:text-7xl mb-6">Photography</h1>
        <p className="text-chesto-charcoal/60 font-body text-lg max-w-xl leading-relaxed">
          From wide landscapes to tight macro details — a collection of moments worth keeping.
        </p>
      </div>

      {/* Category grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/photography/${cat.slug}`}
              className={`photo-card group ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              style={i !== 0 ? { aspectRatio: '3/2' } : {}}
            >
              {covers[cat.slug] ? (
                <img src={covers[cat.slug]} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className={`w-full h-full ${
                  ['bg-stone-800','bg-stone-700','bg-stone-600','bg-stone-700','bg-stone-800','bg-stone-600'][i]
                } flex items-center justify-center`}>
                  <span className="text-white/20 text-xs tracking-widest uppercase">{cat.label}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-chesto-dark/60 hover:bg-chesto-dark/40 transition-all duration-400 flex flex-col justify-end p-6 md:p-8">
                <p className="section-label text-chesto-gold mb-1">{cat.label}</p>
                <p className="text-chesto-cream/70 text-sm font-body">{cat.description}</p>
                <span className="mt-4 text-xs text-chesto-cream/50 tracking-widest uppercase group-hover:text-chesto-gold transition-colors duration-200">
                  View photos →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
