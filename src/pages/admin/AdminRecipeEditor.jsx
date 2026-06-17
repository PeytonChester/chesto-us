import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminRecipeEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', category: 'Dinner',
    prepTime: '', cookTime: '', servings: 4, difficulty: 'Medium',
    ingredients: [{ amount: '', unit: '', name: '' }],
    instructions: [{ text: '', substeps: [] }],
    notes: '', imageUrl: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getDoc(doc(db, 'recipes', id)).then(snap => {
      if (snap.exists()) setForm({ ...snap.data() })
      setLoading(false)
    })
  }, [id, isEdit])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const autoSlug = (title) => {
    set('title', title)
    if (!isEdit) set('slug', slugify(title))
  }

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { amount: '', unit: '', name: '' }] }))
  const setIngredient = (i, field, val) => setForm(f => {
    const next = [...f.ingredients]
    next[i] = { ...next[i], [field]: val }
    return { ...f, ingredients: next }
  })
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))

  const addInstruction = () => setForm(f => ({ ...f, instructions: [...f.instructions, { text: '', substeps: [] }] }))
  const setInstruction = (i, val) => setForm(f => {
    const next = [...f.instructions]
    next[i] = { ...next[i], text: val }
    return { ...f, instructions: next }
  })
  const removeInstruction = (i) => setForm(f => ({ ...f, instructions: f.instructions.filter((_, idx) => idx !== i) }))
  const addSubstep = (i) => setForm(f => {
    const next = [...f.instructions]
    next[i] = { ...next[i], substeps: [...(next[i].substeps || []), ''] }
    return { ...f, instructions: next }
  })
  const setSubstep = (i, j, val) => setForm(f => {
    const next = [...f.instructions]
    const subs = [...(next[i].substeps || [])]
    subs[j] = val
    next[i] = { ...next[i], substeps: subs }
    return { ...f, instructions: next }
  })
  const removeSubstep = (i, j) => setForm(f => {
    const next = [...f.instructions]
    next[i] = { ...next[i], substeps: next[i].substeps.filter((_, idx) => idx !== j) }
    return { ...f, instructions: next }
  })

  const uploadImage = () => new Promise((resolve, reject) => {
    if (!imageFile) return resolve(form.imageUrl)
    setUploading(true)
    const path = `recipes/${Date.now()}-${imageFile.name}`
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
      const data = { ...form, imageUrl, updatedAt: serverTimestamp() }
      if (isEdit) {
        await updateDoc(doc(db, 'recipes', id), data)
      } else {
        await addDoc(collection(db, 'recipes'), { ...data, createdAt: serverTimestamp() })
      }
      navigate('/admin/recipes')
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
        <Link to="/admin/recipes" className="text-chesto-cream/40 hover:text-chesto-cream text-sm transition-colors">← Recipes</Link>
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">{isEdit ? 'Edit Recipe' : 'New Recipe'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
        {/* Basic info */}
        <section className="space-y-4">
          <div>
            <label className="field-label text-chesto-cream/50">Title</label>
            <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" value={form.title} onChange={e => autoSlug(e.target.value)} required />
          </div>
          <div>
            <label className="field-label text-chesto-cream/50">Slug (URL)</label>
            <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream font-mono text-sm" value={form.slug} onChange={e => set('slug', e.target.value)} required />
          </div>
          <div>
            <label className="field-label text-chesto-cream/50">Excerpt</label>
            <textarea className="field-textarea bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream h-20" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label text-chesto-cream/50">Category</label>
              <select className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label text-chesto-cream/50">Difficulty</label>
              <select className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label text-chesto-cream/50">Prep Time</label>
              <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" placeholder="e.g. 15 min" value={form.prepTime} onChange={e => set('prepTime', e.target.value)} />
            </div>
            <div>
              <label className="field-label text-chesto-cream/50">Cook Time</label>
              <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" placeholder="e.g. 30 min" value={form.cookTime} onChange={e => set('cookTime', e.target.value)} />
            </div>
            <div>
              <label className="field-label text-chesto-cream/50">Servings</label>
              <input type="number" min="1" className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream" value={form.servings} onChange={e => set('servings', Number(e.target.value))} />
            </div>
          </div>
        </section>

        {/* Cover image */}
        <section>
          <label className="field-label text-chesto-cream/50">Cover Image</label>
          {form.imageUrl && <img src={form.imageUrl} alt="cover" className="w-32 h-20 object-cover mb-3" />}
          <input type="file" accept="image/*" className="text-chesto-cream/50 text-sm" onChange={e => setImageFile(e.target.files[0])} />
          {uploading && <p className="text-chesto-gold text-xs mt-1">Uploading…</p>}
        </section>

        {/* Ingredients */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-chesto-cream font-body font-medium">Ingredients</h2>
            <button type="button" onClick={addIngredient} className="text-xs text-chesto-gold hover:text-chesto-gold-light">+ Add</button>
          </div>
          <div className="space-y-2">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-20 text-sm" placeholder="Amount" value={ing.amount} onChange={e => setIngredient(i, 'amount', e.target.value)} />
                <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-20 text-sm" placeholder="Unit" value={ing.unit} onChange={e => setIngredient(i, 'unit', e.target.value)} />
                <input className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream flex-1 text-sm" placeholder="Ingredient name" value={ing.name} onChange={e => setIngredient(i, 'name', e.target.value)} />
                <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 text-lg leading-none px-2">×</button>
              </div>
            ))}
          </div>
        </section>

        {/* Instructions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-chesto-cream font-body font-medium">Instructions</h2>
            <button type="button" onClick={addInstruction} className="text-xs text-chesto-gold hover:text-chesto-gold-light">+ Add Step</button>
          </div>
          <div className="space-y-5">
            {form.instructions.map((step, i) => (
              <div key={i} className="space-y-2">
                <div className="flex gap-3 items-start">
                  <span className="text-chesto-gold/40 font-display font-semibold text-xl leading-none mt-3 w-6 flex-shrink-0">{i + 1}</span>
                  <textarea
                    className="field-textarea bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream flex-1 h-20 text-sm"
                    placeholder={`Step ${i + 1}…`}
                    value={step.text}
                    onChange={e => setInstruction(i, e.target.value)}
                  />
                  <div className="flex flex-col gap-1 mt-2">
                    <button type="button" onClick={() => addSubstep(i)} className="text-xs text-chesto-gold/60 hover:text-chesto-gold whitespace-nowrap">+ sub</button>
                    <button type="button" onClick={() => removeInstruction(i)} className="text-red-400 text-lg leading-none px-1">×</button>
                  </div>
                </div>
                {(step.substeps || []).map((sub, j) => (
                  <div key={j} className="flex gap-3 items-start ml-9">
                    <span className="text-chesto-gold/30 font-mono text-xs leading-none mt-3 w-6 flex-shrink-0">{i + 1}{String.fromCharCode(97 + j)}</span>
                    <textarea
                      className="field-textarea bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream/80 flex-1 h-14 text-sm"
                      placeholder={`Sub-step ${i + 1}${String.fromCharCode(97 + j)}…`}
                      value={sub}
                      onChange={e => setSubstep(i, j, e.target.value)}
                    />
                    <button type="button" onClick={() => removeSubstep(i, j)} className="text-red-400 text-lg leading-none px-1 mt-2">×</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="field-label text-chesto-cream/50">Notes / Tips</label>
          <textarea className="field-textarea bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream h-24" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional tips, variations, storage notes…" />
        </section>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={saving || uploading} className="btn-gold disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Recipe'}
          </button>
          <Link to="/admin/recipes" className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
