import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useBlogSettings } from '../../hooks/useBlogSettings'

export default function AdminBlogCategories() {
  const { categories } = useBlogSettings()
  const [editingLabel, setEditingLabel] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const [saving, setSaving] = useState(false)

  const saveSettings = (updated) =>
    setDoc(doc(db, 'settings', 'blog'), { categories: updated }, { merge: true })

  const startEdit = (label) => {
    setEditingLabel(label)
    setEditValue(label)
  }

  const saveEdit = async () => {
    const oldLabel = editingLabel
    const newLabel = editValue.trim()
    if (!newLabel || newLabel === oldLabel) { setEditingLabel(null); return }
    if (categories.includes(newLabel)) return alert('That category already exists.')

    setSaving(true)
    try {
      const updated = categories.map(c => (c === oldLabel ? newLabel : c))
      await saveSettings(updated)

      const snap = await getDocs(query(collection(db, 'posts'), where('category', '==', oldLabel)))
      if (!snap.empty) {
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.update(d.ref, { category: newLabel }))
        await batch.commit()
      }

      setEditingLabel(null)
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (label) => {
    if (!window.confirm(`Remove "${label}"? Posts in this category will keep their value but won't match any category.`)) return
    await saveSettings(categories.filter(c => c !== label))
    if (editingLabel === label) setEditingLabel(null)
  }

  const addCategory = async (e) => {
    e.preventDefault()
    const label = addValue.trim()
    if (!label) return
    if (categories.includes(label)) return alert('That category already exists.')
    await saveSettings([...categories, label])
    setAddValue('')
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link to="/admin/blog" className="text-chesto-cream/40 hover:text-chesto-cream text-sm transition-colors">← Blog</Link>
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">Blog Categories</h1>
      </div>
      <p className="text-chesto-cream/40 text-sm mb-10">
        Renaming a category automatically updates all posts that use it.
      </p>

      <div className="space-y-2 mb-12">
        {categories.map(label => (
          <div key={label}>
            {editingLabel === label ? (
              <div className="bg-chesto-charcoal/40 border border-chesto-gold/30 p-4 space-y-3">
                <div>
                  <input
                    autoFocus
                    className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full sm:w-64"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingLabel(null) }}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveEdit} disabled={saving} className="btn-gold text-xs disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingLabel(null)} className="text-xs text-chesto-cream/40 hover:text-chesto-cream transition-colors px-3">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-chesto-charcoal/20 px-4 py-3 group hover:bg-chesto-charcoal/30 transition-colors">
                <span className="text-chesto-cream font-body font-medium">{label}</span>
                <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
                  <button
                    onClick={() => startEdit(label)}
                    className="text-xs text-chesto-gold hover:text-chesto-gold-light px-3 py-1.5 border border-chesto-gold/30 hover:border-chesto-gold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(label)}
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
      <form onSubmit={addCategory} className="flex gap-3 items-end">
        <div>
          <label className="field-label text-chesto-cream/50">Name</label>
          <input
            className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full sm:w-48"
            placeholder="e.g. Film"
            value={addValue}
            onChange={e => setAddValue(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-gold">Add</button>
      </form>
    </div>
  )
}
