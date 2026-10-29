import { useState } from 'react'
import { doc, setDoc, updateDoc, deleteField, FieldPath } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db } from '../../firebase'
import { storage } from '../../firebaseStorage'
import { fixedImage, warmImages } from '../../lib/images'
import { WATER_LOG_DOC, WATER_LOG_STORAGE_DIR, formatTestDate } from '../../lib/waterLog'

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time

const INPUT = 'field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream placeholder-chesto-cream/20'

// Phone photos are 4000px+ and several MB; the page never shows more than
// this, so shrink before uploading (and drop EXIF location data with it).
const MAX_SIDE = 2560

async function shrink(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88))
  if (!blob) throw new Error("couldn't read that image")
  return { blob, width, height }
}

// Tank photos shown at the bottom of the public water log, stored in the
// settings/waterLog doc's `photos` map
export default function AdminTankPhotos({ photos }) {
  const [file, setFile] = useState(null)
  const [date, setDate] = useState(today)
  const [alt, setAlt] = useState('')
  const [progress, setProgress] = useState(null)
  const [status, setStatus] = useState('')
  const [inputKey, setInputKey] = useState(0)

  const docRef = doc(db, ...WATER_LOG_DOC)

  const upload = async e => {
    e.preventDefault()
    if (!file) return setStatus('Choose a photo first.')
    if (!date) return setStatus('Pick a date first.')
    setProgress(0)
    setStatus('Preparing…')
    try {
      const { blob, width, height } = await shrink(file)
      const id = `${date}-${Date.now()}`
      const path = `${WATER_LOG_STORAGE_DIR}/${id}.jpg`
      const task = uploadBytesResumable(ref(storage, path), blob, { contentType: 'image/jpeg' })
      await new Promise((resolve, reject) => task.on('state_changed',
        s => { setProgress(Math.round(100 * s.bytesTransferred / s.totalBytes)); setStatus('Uploading…') },
        reject, resolve))
      const url = await getDownloadURL(task.snapshot.ref)
      const photo = { date, url, path, width, height, uploadedAt: Date.now() }
      if (alt.trim()) photo.alt = alt.trim()
      await setDoc(docRef, { photos: { [id]: photo } }, { mergeFields: [new FieldPath('photos', id)] })
      warmImages([url], { widths: [128, 640, 1080, 1920] }).catch(() => {}) // prepare grid and lightbox sizes
      setFile(null)
      setAlt('')
      setInputKey(k => k + 1)
      setStatus(`Added the ${formatTestDate(date)} photo.`)
    } catch (err) {
      setStatus('Upload failed: ' + err.message)
    } finally {
      setProgress(null)
    }
  }

  const remove = async p => {
    if (!window.confirm(`Delete the ${formatTestDate(p.date)} photo?`)) return
    try {
      await updateDoc(docRef, new FieldPath('photos', p.id), deleteField())
      if (p.path) await deleteObject(ref(storage, p.path)).catch(() => {}) // already gone is fine
      setStatus('Deleted.')
    } catch (err) {
      setStatus('Delete failed: ' + err.message)
    }
  }

  const busy = progress !== null

  return (
    <section className="mt-12">
      <h2 className="font-display font-semibold text-2xl text-chesto-cream mb-2">Tank Photos</h2>
      <p className="text-chesto-cream/40 text-sm mb-6">
        Shown newest first at the bottom of the water log. Photos added before October 30 are built into the site and aren't listed here.
      </p>

      <form onSubmit={upload} className="bg-chesto-charcoal/40 border border-chesto-cream/10 p-5 md:p-6 space-y-5 mb-8">
        <div className="grid sm:grid-cols-[16rem_1fr] gap-x-4 gap-y-5">
          <div>
            <label htmlFor="tp-date" className="field-label text-chesto-cream/50">Photo date</label>
            <input id="tp-date" type="date" required className={`${INPUT} wl-date font-mono py-2.5`} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tp-file" className="field-label text-chesto-cream/50">Photo</label>
            <input
              key={inputKey}
              id="tp-file"
              type="file"
              accept="image/*"
              className="text-chesto-cream/50 text-sm py-2.5"
              onChange={e => setFile(e.target.files[0] ?? null)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="tp-alt" className="field-label text-chesto-cream/50">Description (alt text)</label>
          <input
            id="tp-alt"
            className={INPUT}
            placeholder="What's in the photo, e.g. Queso by the spiderwood after a trim"
            value={alt}
            onChange={e => setAlt(e.target.value)}
          />
          <p className="text-chesto-cream/20 text-xs mt-1">For screen readers and search engines. Leave blank to use the date.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="btn-gold text-xs disabled:opacity-60">
            {busy ? `Uploading${progress ? ` ${progress}%` : '…'}` : 'Upload Photo'}
          </button>
          <span role="status" className="text-chesto-cream/50 text-xs">{status}</span>
        </div>
      </form>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(p => (
            <li key={p.id}>
              <img {...fixedImage(p.url, 640)} alt={p.alt || ''} loading="lazy" className="w-full aspect-square object-cover bg-chesto-cream/5" />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-chesto-cream/60">{formatTestDate(p.date)}</span>
                <button type="button" onClick={() => remove(p)} className="text-xs tracking-wider uppercase text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
              {p.alt && <p className="mt-1 text-xs text-chesto-cream/30 line-clamp-2">{p.alt}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
