import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import RichTextEditor from '../../components/RichTextEditor'

const CATEGORIES = ['Photography', 'Cooking', 'Travel', 'Life', 'Gear', 'Other']

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminBlogEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', category: 'Photography',
    body: '', imageUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
  })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getDoc(doc(db, 'posts', id)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        const ts = data.publishedAt ?? data.createdAt
        const publishedAt = ts?.toDate?.()?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]
        setForm({ ...data, publishedAt, body: Array.isArray(data.body) ? data.body.map(p => `<p>${p}</p>`).join('') : data.body || '' })
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const autoSlug = (title) => {
    set('title', title)
    if (!isEdit) set('slug', slugify(title))
  }

  const uploadImage = () => new Promise((resolve, reject) => {
    if (!imageFile) return resolve(form.imageUrl)
    setUploading(true)
    const path = `posts/${Date.now()}-${imageFile.name}`
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
      const imageUrl = await uploadImage()
      const publishedAt = Timestamp.fromDate(new Date(form.publishedAt + 'T12:00:00'))
      const data = { ...form, imageUrl, publishedAt, updatedAt: serverTimestamp() }
      if (isEdit) {
        await updateDoc(doc(db, 'posts', id), data)
      } else {
        await addDoc(collection(db, 'posts'), { ...data, createdAt: serverTimestamp() })
      }
      navigate('/admin/blog')
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-chesto-cream/40 text-sm animate-pulse">Loading…</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/blog" className="text-chesto-cream/40 hover:text-chesto-cream text-sm transition-colors">← Blog</Link>
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">{isEdit ? 'Edit Post' : 'New Post'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div>
          <label className="field-label text-chesto-cream/50">Title</label>
          <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" value={form.title} onChange={e => autoSlug(e.target.value)} required />
        </div>
        <div>
          <label className="field-label text-chesto-cream/50">Slug</label>
          <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream font-mono text-sm" value={form.slug} onChange={e => set('slug', e.target.value)} required />
        </div>
        <div>
          <label className="field-label text-chesto-cream/50">Category</label>
          <select className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label text-chesto-cream/50">Publish Date</label>
          <input
            type="date"
            className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream font-mono text-sm [&::-webkit-calendar-picker-indicator]:invert"
            value={form.publishedAt}
            onChange={e => set('publishedAt', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label text-chesto-cream/50">Excerpt</label>
          <textarea className="field-textarea bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream h-20" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Short description shown on the blog listing…" />
        </div>

        <div>
          <label className="field-label text-chesto-cream/50">Cover Image</label>
          {form.imageUrl && <img src={form.imageUrl} alt="cover" className="w-32 h-20 object-cover mb-3" />}
          <input type="file" accept="image/*" className="text-chesto-cream/50 text-sm" onChange={e => setImageFile(e.target.files[0])} />
          {uploading && <p className="text-chesto-gold text-xs mt-1">Uploading…</p>}
        </div>

        <div>
          <label className="field-label text-chesto-cream/50">Body</label>
          <RichTextEditor value={form.body} onChange={val => set('body', val)} />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={saving || uploading} className="btn-gold disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Post'}
          </button>
          <Link to="/admin/blog" className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
