import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'

export default function AdminHome() {
  const [form, setForm] = useState({ heroTagline: '', heroHeading: '', heroImageUrl: '' })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'settings', 'home')).then(snap => {
      if (snap.exists()) setForm(snap.data())
      setLoading(false)
    })
  }, [])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const uploadImage = () => new Promise((resolve, reject) => {
    if (!imageFile) return resolve(form.heroImageUrl)
    setUploading(true)
    const path = `settings/hero-${Date.now()}-${imageFile.name}`
    const task = uploadBytesResumable(ref(storage, path), imageFile)
    task.on('state_changed', null, reject, async () => {
      const url = await getDownloadURL(task.snapshot.ref)
      setUploading(false)
      resolve(url)
    })
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const heroImageUrl = await uploadImage()
      await setDoc(doc(db, 'settings', 'home'), { ...form, heroImageUrl }, { merge: true })
      setForm(f => ({ ...f, heroImageUrl }))
      setImageFile(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-chesto-cream/40 text-sm animate-pulse">Loading…</div>

  return (
    <div>
      <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-8">Home Page</h1>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <section>
          <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Hero Text</h2>
          <div className="space-y-4">
            <div>
              <label className="field-label text-chesto-cream/50">Tagline</label>
              <input
                className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream"
                placeholder="e.g. Welcome to the party"
                value={form.heroTagline}
                onChange={e => set('heroTagline', e.target.value)}
              />
              <p className="text-chesto-cream/20 text-xs mt-1">Small label above the main heading</p>
            </div>
            <div>
              <label className="field-label text-chesto-cream/50">Heading</label>
              <textarea
                className="field-textarea bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream h-24"
                placeholder="e.g. Photography.&#10;Food. Life."
                value={form.heroHeading}
                onChange={e => set('heroHeading', e.target.value)}
              />
              <p className="text-chesto-cream/20 text-xs mt-1">Use a new line to break the heading across lines</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Hero Image</h2>
          {form.heroImageUrl && (
            <img src={form.heroImageUrl} alt="Hero" className="w-full h-48 object-cover mb-4" />
          )}
          <input
            type="file"
            accept="image/*"
            className="text-chesto-cream/50 text-sm"
            onChange={e => setImageFile(e.target.files[0])}
          />
          {imageFile && <p className="text-chesto-cream/40 text-xs mt-1">{imageFile.name} selected</p>}
          {uploading && <p className="text-chesto-gold text-xs mt-1">Uploading…</p>}
        </section>

        <button type="submit" disabled={saving || uploading} className="btn-gold disabled:opacity-50">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
