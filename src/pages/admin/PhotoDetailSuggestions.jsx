import { useState } from 'react'
import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { fixedImage } from '../../lib/images'
import suggestions from '../../data/photoDetails.json'

// Storage path of a photo ("photos/wildlife/123-IMG_1.jpg"), from its doc or its download URL
function storagePathOf(photo) {
  if (photo.storagePath) return photo.storagePath
  const match = /\/o\/([^?]+)/.exec(photo.url ?? '')
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Suggested titles and alt text (src/data/photoDetails.json, keyed by storage
 * path) that haven't been applied yet. Shows a banner, then a review dialog
 * where they can be applied in one go.
 */
export default function PhotoDetailSuggestions({ photos, showToast }) {
  const [open, setOpen] = useState(false)
  const [skipped, setSkipped] = useState(() => new Set())
  const [saving, setSaving] = useState(false)

  const pending = photos
    .map(photo => ({ photo, suggestion: suggestions[storagePathOf(photo)] }))
    .filter(({ photo, suggestion }) => suggestion &&
      (suggestion.title !== (photo.title ?? '') || suggestion.alt !== (photo.alt ?? '')))
  if (pending.length === 0) return null

  const chosen = pending.filter(({ photo }) => !skipped.has(photo.id))
  const toggle = id => setSkipped(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const apply = async () => {
    setSaving(true)
    try {
      for (let i = 0; i < chosen.length; i += 450) {
        const batch = writeBatch(db)
        chosen.slice(i, i + 450).forEach(({ photo, suggestion }) =>
          batch.update(doc(db, 'photos', photo.id), { title: suggestion.title, alt: suggestion.alt }))
        await batch.commit()
      }
      showToast(`Updated ${chosen.length} photo${chosen.length !== 1 ? 's' : ''}.`)
      setOpen(false)
    } catch (err) {
      showToast('Failed to apply: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3 border border-chesto-gold/30 bg-chesto-gold/10 px-4 py-3">
        <p className="text-chesto-cream text-sm flex-1 min-w-[12rem]">
          {pending.length} suggested photo title{pending.length !== 1 ? 's' : ''} and alt text {pending.length !== 1 ? 'are' : 'is'} ready to review.
        </p>
        <button type="button" onClick={() => setOpen(true)} className="btn-gold text-sm px-4 py-2">Review</button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-chesto-dark/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
            className="bg-chesto-charcoal w-full max-w-2xl max-h-full flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Suggested photo details"
          >
            <div className="px-6 pt-6 pb-4 border-b border-chesto-cream/10">
              <h2 className="font-display font-semibold text-xl text-chesto-cream">Suggested photo details</h2>
              <p className="text-chesto-cream/40 text-sm mt-1">Untick any you don't want. You can still edit each photo afterwards with Options → Edit Details.</p>
            </div>
            <ul className="overflow-y-auto divide-y divide-chesto-cream/10 px-6">
              {pending.map(({ photo, suggestion }) => (
                <li key={photo.id}>
                  <label className="flex gap-4 py-4 cursor-pointer">
                    <input type="checkbox" checked={!skipped.has(photo.id)} onChange={() => toggle(photo.id)} className="mt-1 accent-chesto-gold shrink-0" />
                    <img {...fixedImage(photo.url, 256)} loading="lazy" alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="min-w-0 text-sm">
                      <p className="text-chesto-cream font-medium">{suggestion.title}</p>
                      <p className="text-chesto-cream/60 mt-1">{suggestion.alt}</p>
                      {(photo.title || photo.alt) && (
                        <p className="text-chesto-cream/30 text-xs mt-2">Replaces: {[photo.title, photo.alt].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <div className="px-6 py-4 border-t border-chesto-cream/10 flex gap-3 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-chesto-cream/50 hover:text-chesto-cream px-3 py-2">Cancel</button>
              <button type="button" onClick={apply} disabled={saving || chosen.length === 0} className="btn-gold text-sm disabled:opacity-50">
                {saving ? 'Applying…' : `Apply ${chosen.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
