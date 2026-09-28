import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCollection } from '../hooks/useCollection'
import { usePhotographySettings } from '../hooks/usePhotographySettings'
import { fixedImage } from '../lib/images'

// Admin modal for choosing a photo from the uploaded library, filterable by
// category and album. Calls onSelect(photo) with the chosen photo document.
export default function PhotoPicker({ onSelect, onClose, selectedUrl }) {
  const { docs: photos, loading } = useCollection('photos', 'createdAt', 'desc')
  const { categories, albums } = usePhotographySettings()
  const [category, setCategory] = useState('')
  const [album, setAlbum] = useState('')

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Only offer categories that have photos
  const usedCategories = useMemo(
    () => categories.filter(c => photos.some(p => p.category === c.slug)),
    [categories, photos]
  )
  const categoryAlbums = albums.filter(a => a.category === category)
  const shown = photos.filter(p =>
    (!category || p.category === category) && (!album || p.album === album)
  )

  const chip = (active) =>
    `px-3 py-1.5 text-xs tracking-wider uppercase border transition-colors ${
      active
        ? 'bg-chesto-gold border-chesto-gold text-chesto-dark'
        : 'border-chesto-cream/20 text-chesto-cream/60 hover:text-chesto-cream hover:border-chesto-cream/40'
    }`

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-chesto-dark border border-chesto-cream/10 w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a photo"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-chesto-cream/10">
          <h2 className="font-display font-semibold text-xl text-chesto-cream">Choose a Photo</h2>
          <button type="button" onClick={onClose} className="text-chesto-cream/50 hover:text-chesto-cream text-2xl leading-none px-2" aria-label="Close">×</button>
        </div>

        <div className="px-5 py-3 border-b border-chesto-cream/10 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(!category)} onClick={() => { setCategory(''); setAlbum('') }}>All</button>
            {usedCategories.map(c => (
              <button key={c.slug} type="button" className={chip(category === c.slug)} onClick={() => { setCategory(c.slug); setAlbum('') }}>
                {c.label}
              </button>
            ))}
          </div>
          {categoryAlbums.length > 0 && (
            <select
              value={album}
              onChange={e => setAlbum(e.target.value)}
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream text-sm py-2 w-auto"
              aria-label="Album"
            >
              <option value="">All albums</option>
              {categoryAlbums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-chesto-cream/40 text-sm animate-pulse">Loading photos…</p>
          ) : shown.length === 0 ? (
            <p className="text-chesto-cream/40 text-sm">No photos here yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {shown.map(photo => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onSelect(photo)}
                  className={`relative aspect-square overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-chesto-gold ${
                    photo.url === selectedUrl ? 'ring-2 ring-chesto-gold' : ''
                  }`}
                  title={photo.title || undefined}
                >
                  <img {...fixedImage(photo.url, 384)} loading="lazy" alt={photo.title || ''} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {photo.url === selectedUrl && (
                    <span className="absolute top-1.5 right-1.5 bg-chesto-gold text-chesto-dark text-xs w-5 h-5 flex items-center justify-center">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
