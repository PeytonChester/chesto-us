import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { usePhotographySettings } from '../../hooks/usePhotographySettings'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminCategories() {
  const { categories, covers } = usePhotographySettings()
  const [editingSlug, setEditingSlug] = useState(null)
  const [editForm, setEditForm] = useState({ label: '', description: '' })
  const [addForm, setAddForm] = useState({ label: '', description: '' })
  const [saving, setSaving] = useState(false)

  const startEdit = (cat) => {
    setEditingSlug(cat.slug)
    setEditForm({ label: cat.label, description: cat.description || '' })
  }

  const saveEdit = async () => {
    const oldSlug = editingSlug
    const newSlug = slugify(editForm.label)
    const newLabel = editForm.label.trim()
    const newDesc = editForm.description.trim()
    if (!newLabel) return

    setSaving(true)
    try {
      const slugChanged = oldSlug !== newSlug

      const updatedCategories = categories.map(c =>
        c.slug === oldSlug ? { slug: newSlug, label: newLabel, description: newDesc } : c
      )

      const updatedCovers = { ...covers }
      if (slugChanged && covers[oldSlug]) {
        updatedCovers[newSlug] = updatedCovers[oldSlug]
        delete updatedCovers[oldSlug]
      }

      await setDoc(doc(db, 'settings', 'photography'), {
        categories: updatedCategories,
        covers: updatedCovers,
      }, { merge: true })

      if (slugChanged) {
        const snap = await getDocs(query(collection(db, 'photos'), where('category', '==', oldSlug)))
        if (!snap.empty) {
          const batch = writeBatch(db)
          snap.docs.forEach(d => batch.update(d.ref, { category: newSlug }))
          await batch.commit()
        }
      }

      setEditingSlug(null)
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (slug) => {
    if (!window.confirm('Remove this category? Photos in it will remain but lose their category.')) return
    const updatedCategories = categories.filter(c => c.slug !== slug)
    const updatedCovers = { ...covers }
    delete updatedCovers[slug]
    await setDoc(doc(db, 'settings', 'photography'), {
      categories: updatedCategories,
      covers: updatedCovers,
    }, { merge: true })
    if (editingSlug === slug) setEditingSlug(null)
  }

  const addCategory = async (e) => {
    e.preventDefault()
    if (!addForm.label.trim()) return
    const slug = slugify(addForm.label)
    if (categories.find(c => c.slug === slug)) return alert('A category with that name already exists.')
    const updated = [...categories, { slug, label: addForm.label.trim(), description: addForm.description.trim() }]
    await setDoc(doc(db, 'settings', 'photography'), { categories: updated }, { merge: true })
    setAddForm({ label: '', description: '' })
  }

  const newSlug = editingSlug ? slugify(editForm.label) : ''
  const slugWillChange = editingSlug && newSlug !== editingSlug

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link to="/admin/photos" className="text-chesto-cream/40 hover:text-chesto-cream text-sm transition-colors">← Photos</Link>
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">Categories</h1>
      </div>
      <p className="text-chesto-cream/40 text-sm mb-10">
        Renaming a category automatically reassigns all photos that belong to it.
      </p>

      <div className="space-y-2 mb-12">
        {categories.map(cat => (
          <div key={cat.slug}>
            {editingSlug === cat.slug ? (
              <div className="bg-chesto-charcoal/40 border border-chesto-gold/30 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label text-chesto-cream/50">Label</label>
                    <input
                      autoFocus
                      className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full"
                      value={editForm.label}
                      onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label text-chesto-cream/50">Description</label>
                    <input
                      className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full"
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>
                {slugWillChange && (
                  <p className="text-chesto-gold/70 text-xs font-mono">
                    Slug: <span className="line-through opacity-50">{editingSlug}</span> → {newSlug} — all photos will be reassigned.
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={saveEdit} disabled={saving} className="btn-gold text-xs disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingSlug(null)} className="text-xs text-chesto-cream/40 hover:text-chesto-cream transition-colors px-3">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-chesto-charcoal/20 px-4 py-3 group hover:bg-chesto-charcoal/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <span className="text-chesto-cream font-body font-medium">{cat.label}</span>
                  {cat.description && <span className="text-chesto-cream/30 text-xs ml-3">{cat.description}</span>}
                  <span className="text-chesto-cream/20 font-mono text-xs ml-3">{cat.slug}</span>
                </div>
                <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-xs text-chesto-gold hover:text-chesto-gold-light px-3 py-1.5 border border-chesto-gold/30 hover:border-chesto-gold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.slug)}
                    className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 hover:border-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Add Category</h2>
      <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div>
          <label className="field-label text-chesto-cream/50">Label</label>
          <input
            className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full sm:w-36"
            placeholder="e.g. Portraits"
            value={addForm.label}
            onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
          />
        </div>
        <div>
          <label className="field-label text-chesto-cream/50">Description</label>
          <input
            className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full sm:w-64"
            placeholder="Short description"
            value={addForm.description}
            onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
        <button type="submit" className="btn-gold">Add</button>
      </form>
    </div>
  )
}
