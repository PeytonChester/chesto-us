import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, setDoc, writeBatch, deleteField } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'
import { usePhotographySettings } from '../../hooks/usePhotographySettings'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Firestore batches are capped at 500 writes
async function updatePhotos(photos, data) {
  for (let i = 0; i < photos.length; i += 450) {
    const batch = writeBatch(db)
    photos.slice(i, i + 450).forEach(p => batch.update(doc(db, 'photos', p.id), data))
    await batch.commit()
  }
}

export default function AdminAlbums() {
  const { docs: photos } = useCollection('photos', 'createdAt', 'desc')
  const { categories, albums } = usePhotographySettings()
  const [addForm, setAddForm] = useState({ title: '', category: categories[0]?.slug ?? '', moveLoose: true })
  const [editingKey, setEditingKey] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const albumKey = a => `${a.category}/${a.id}`
  const saveAlbums = list => setDoc(doc(db, 'settings', 'photography'), { albums: list }, { merge: true })

  const addCategory = addForm.category || categories[0]?.slug
  const albumIdsIn = cat => new Set(albums.filter(a => a.category === cat).map(a => a.id))
  const loosePhotos = cat => {
    const ids = albumIdsIn(cat)
    return photos.filter(p => p.category === cat && !ids.has(p.album))
  }
  const looseCount = addCategory ? loosePhotos(addCategory).length : 0

  const addAlbum = async (e) => {
    e.preventDefault()
    const title = addForm.title.trim()
    const id = slugify(title)
    if (!title || !id || !addCategory) return
    if (albumIdsIn(addCategory).has(id)) return alert('An album with that name already exists in this category.')

    setSaving(true)
    try {
      await saveAlbums([...albums, { id, title, category: addCategory, cover: '' }])
      if (addForm.moveLoose) await updatePhotos(loosePhotos(addCategory), { album: id })
      setAddForm(f => ({ ...f, title: '' }))
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveTitle = async (album) => {
    const title = editTitle.trim()
    if (!title) return
    await saveAlbums(albums.map(a => albumKey(a) === albumKey(album) ? { ...a, title } : a))
    setEditingKey(null)
  }

  const moveAlbum = async (album, dir) => {
    const list = [...albums]
    const i = list.findIndex(a => albumKey(a) === albumKey(album))
    // swap with the nearest album in the same category
    let j = i + dir
    while (j >= 0 && j < list.length && list[j].category !== album.category) j += dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    await saveAlbums(list)
  }

  const deleteAlbum = async (album) => {
    if (!window.confirm(`Delete the album "${album.title}"? Its photos stay in ${album.category} but won't be in an album.`)) return
    try {
      await updatePhotos(photos.filter(p => p.category === album.category && p.album === album.id), { album: deleteField() })
      await saveAlbums(albums.filter(a => albumKey(a) !== albumKey(album)))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <Link to="/admin/photos" className="text-chesto-cream/40 hover:text-chesto-cream text-sm transition-colors">← Photos</Link>
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">Albums</h1>
      </div>
      <p className="text-chesto-cream/40 text-sm mb-10">
        When a category has albums, visitors see album covers first and click through to each album's photos.
        Set an album's cover and move photos between albums from the Photos page.
      </p>

      {categories.map(cat => {
        const catAlbums = albums.filter(a => a.category === cat.slug)
        if (catAlbums.length === 0) return null
        return (
          <div key={cat.slug} className="mb-10">
            <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-3">{cat.label}</h2>
            <div className="space-y-2">
              {catAlbums.map((album, idx) => {
                const albumPhotos = photos.filter(p => p.category === cat.slug && p.album === album.id)
                const cover = album.cover || albumPhotos[0]?.url
                const editing = editingKey === albumKey(album)
                return (
                  <div key={album.id} className="flex items-center gap-4 bg-chesto-charcoal/20 px-4 py-3 group hover:bg-chesto-charcoal/30 transition-colors">
                    {cover
                      ? <img src={cover} alt="" className="w-16 h-11 object-cover flex-shrink-0" />
                      : <div className="w-16 h-11 bg-chesto-charcoal flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveTitle(album); if (e.key === 'Escape') setEditingKey(null) }}
                          />
                          <button onClick={() => saveTitle(album)} className="btn-gold text-xs">Save</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-chesto-cream font-body font-medium truncate">{album.title}</p>
                          <p className="text-chesto-cream/30 text-xs">
                            {albumPhotos.length} photo{albumPhotos.length !== 1 ? 's' : ''}
                            <span className="font-mono ml-3 text-chesto-cream/20">/photography/{cat.slug}/{album.id}</span>
                          </p>
                        </>
                      )}
                    </div>
                    {!editing && (
                      <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {catAlbums.length > 1 && (
                          <>
                            <button onClick={() => moveAlbum(album, -1)} disabled={idx === 0} className="text-xs text-chesto-cream/50 hover:text-chesto-cream px-2 py-1.5 disabled:opacity-20" aria-label="Move up">↑</button>
                            <button onClick={() => moveAlbum(album, 1)} disabled={idx === catAlbums.length - 1} className="text-xs text-chesto-cream/50 hover:text-chesto-cream px-2 py-1.5 disabled:opacity-20" aria-label="Move down">↓</button>
                          </>
                        )}
                        <Link to={`/photography/${cat.slug}/${album.id}`} target="_blank" className="text-xs text-chesto-cream/50 hover:text-chesto-cream px-3 py-1.5 border border-chesto-cream/20 transition-colors">
                          View
                        </Link>
                        <button
                          onClick={() => { setEditingKey(albumKey(album)); setEditTitle(album.title) }}
                          className="text-xs text-chesto-gold hover:text-chesto-gold-light px-3 py-1.5 border border-chesto-gold/30 hover:border-chesto-gold transition-colors"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteAlbum(album)}
                          className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 hover:border-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {albums.length === 0 && (
        <p className="text-chesto-cream/30 text-sm mb-10">No albums yet.</p>
      )}

      <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Add Album</h2>
      <form onSubmit={addAlbum} className="space-y-4 max-w-xl">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="field-label text-chesto-cream/50">Title</label>
            <input
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-full"
              placeholder="e.g. Savannah, Georgia - 2025"
              value={addForm.title}
              onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="field-label text-chesto-cream/50">Category</label>
            <select
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream"
              value={addCategory}
              onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
            >
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
        </div>
        {looseCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-chesto-cream/60 cursor-pointer">
            <input
              type="checkbox"
              checked={addForm.moveLoose}
              onChange={e => setAddForm(f => ({ ...f, moveLoose: e.target.checked }))}
              className="accent-chesto-gold"
            />
            Move the {looseCount} {categories.find(c => c.slug === addCategory)?.label ?? addCategory} photo{looseCount !== 1 ? 's' : ''} not in an album into this album
          </label>
        )}
        <button type="submit" disabled={saving || !addForm.title.trim()} className="btn-gold disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Album'}
        </button>
      </form>
    </div>
  )
}
