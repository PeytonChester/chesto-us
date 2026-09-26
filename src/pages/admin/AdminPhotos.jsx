import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, deleteDoc, doc, setDoc, updateDoc, deleteField, serverTimestamp, writeBatch } from 'firebase/firestore'
import { storage, db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'
import { usePhotographySettings } from '../../hooks/usePhotographySettings'
import { fixedImage } from '../../lib/images'

const UNCATEGORIZED = '__uncategorized'

export default function AdminPhotos() {
  const { docs: photos } = useCollection('photos', 'createdAt', 'desc')
  const { categories, covers, albums } = usePhotographySettings()
  const [uploads, setUploads] = useState([])
  const [category, setCategory] = useState('')
  const [album, setAlbum] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkAlbum, setBulkAlbum] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // The select shows the first category before one is picked
  const uploadCategory = category || categories[0]?.slug || ''
  const uploadAlbums = albums.filter(a => a.category === uploadCategory)
  const albumsIn = cat => albums.filter(a => a.category === cat)

  const handleFiles = (files) => {
    const items = Array.from(files).map(file => ({
      file, progress: 0, category: uploadCategory, album, title: '', done: false, error: null, id: Math.random().toString(36).slice(2)
    }))
    setUploads(prev => [...prev, ...items])
    items.forEach(item => uploadFile(item))
  }

  const uploadFile = (item) => {
    const path = `photos/${item.category}/${Date.now()}-${item.file.name}`
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, item.file)

    task.on('state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: pct } : u))
      },
      (err) => {
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, error: err.message } : u))
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        await addDoc(collection(db, 'photos'), {
          url,
          storagePath: path,
          category: item.category,
          ...(item.album ? { album: item.album } : {}),
          title: item.title || '',
          createdAt: serverTimestamp(),
        })
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, done: true, url } : u))
      }
    )
  }

  const deletePhoto = async (photo) => {
    if (!window.confirm(`Delete "${photo.title || photo.url}"?`)) return
    try {
      if (photo.storagePath) await deleteObject(ref(storage, photo.storagePath))
      await deleteDoc(doc(db, 'photos', photo.id))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  const setCover = async (photo) => {
    try {
      await setDoc(doc(db, 'settings', 'photography'), {
        covers: { ...covers, [photo.category]: photo.url },
      }, { merge: true })
      showToast('Cover photo updated.')
    } catch (err) {
      showToast('Failed to set cover: ' + err.message, 'error')
    }
  }

  const setAlbumCover = async (photo) => {
    try {
      await setDoc(doc(db, 'settings', 'photography'), {
        albums: albums.map(a => a.category === photo.category && a.id === photo.album ? { ...a, cover: photo.url } : a),
      }, { merge: true })
      showToast('Album cover updated.')
    } catch (err) {
      showToast('Failed to set album cover: ' + err.message, 'error')
    }
  }

  const movePhotoToAlbum = async (photo, albumId) => {
    try {
      await updateDoc(doc(db, 'photos', photo.id), { album: albumId || deleteField() })
    } catch (err) {
      showToast('Failed to move photo: ' + err.message, 'error')
    }
  }

  const toggleSelected = (ids, on) => setSelected(prev => {
    const next = new Set(prev)
    ids.forEach(id => (on ?? !next.has(id)) ? next.add(id) : next.delete(id))
    return next
  })

  const exitSelecting = () => { setSelecting(false); setSelected(new Set()); setBulkAlbum(''); setBulkCategory('') }

  // Firestore batches are capped at 500 writes
  const updatePhotos = async (list, data) => {
    for (let i = 0; i < list.length; i += 450) {
      const batch = writeBatch(db)
      list.slice(i, i + 450).forEach(p => batch.update(doc(db, 'photos', p.id), data))
      await batch.commit()
    }
  }

  const selectedPhotos = photos.filter(p => selected.has(p.id))

  // bulkAlbum is "category/albumId"; albums belong to one category, so photos
  // from other categories move into the album's category
  const addSelectedToAlbum = async () => {
    const target = albums.find(a => `${a.category}/${a.id}` === bulkAlbum)
    if (!target || selectedPhotos.length === 0) return
    const moving = selectedPhotos.filter(p => p.category !== target.category).length
    const catLabel = categories.find(c => c.slug === target.category)?.label ?? target.category
    if (moving && !window.confirm(`${moving} of the selected photos ${moving !== 1 ? 'are' : 'is'} in another category and will move to ${catLabel}. Continue?`)) return
    setBulkSaving(true)
    try {
      await updatePhotos(selectedPhotos, { album: target.id, category: target.category })
      showToast(`Added ${selectedPhotos.length} photo${selectedPhotos.length !== 1 ? 's' : ''} to ${target.title}.`)
      exitSelecting()
    } catch (err) {
      showToast('Failed to add to album: ' + err.message, 'error')
    } finally {
      setBulkSaving(false)
    }
  }

  // Albums belong to one category, so moved photos leave their album
  const moveSelectedToCategory = async () => {
    const target = categories.find(c => c.slug === bulkCategory)
    const toMove = selectedPhotos.filter(p => p.category !== bulkCategory)
    if (!target) return
    if (toMove.length === 0) return showToast(`Those photos are already in ${target.label}.`)
    const inAlbum = toMove.filter(p => p.album).length
    if (inAlbum && !window.confirm(`${inAlbum} of these photos ${inAlbum !== 1 ? 'are' : 'is'} in an album and will be taken out of it. Continue?`)) return
    setBulkSaving(true)
    try {
      await updatePhotos(toMove, { category: target.slug, album: deleteField() })
      showToast(`Moved ${toMove.length} photo${toMove.length !== 1 ? 's' : ''} to ${target.label}.`)
      exitSelecting()
    } catch (err) {
      showToast('Failed to move photos: ' + err.message, 'error')
    } finally {
      setBulkSaving(false)
    }
  }

  const removeSelectedFromAlbums = async () => {
    const inAlbum = selectedPhotos.filter(p => p.album)
    if (inAlbum.length === 0) return
    setBulkSaving(true)
    try {
      await updatePhotos(inAlbum, { album: deleteField() })
      showToast(`Removed ${inAlbum.length} photo${inAlbum.length !== 1 ? 's' : ''} from ${inAlbum.length !== 1 ? 'their albums' : 'its album'}.`)
      exitSelecting()
    } catch (err) {
      showToast('Failed to remove from album: ' + err.message, 'error')
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className={selected.size > 0 ? 'pb-24' : ''}>
      {/* Toast */}
      {toast && (
        <div className={`fixed ${selecting && selected.size > 0 ? 'bottom-24' : 'bottom-6'} right-6 z-50 px-5 py-3 text-sm font-body shadow-lg transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-chesto-gold text-chesto-dark'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-1">Photos</h1>
          <p className="text-chesto-cream/40 text-sm">{photos.length} photos in library</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => selecting ? exitSelecting() : setSelecting(true)}
            className={`btn-ghost text-sm ${selecting ? 'bg-chesto-gold border-chesto-gold text-chesto-dark' : 'border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark'}`}
          >
            {selecting ? 'Done Selecting' : 'Select Photos'}
          </button>
          <Link to="/admin/photo-albums" className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark text-sm">
            Albums
          </Link>
          <Link to="/admin/photo-categories" className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark text-sm">
            Edit Categories
          </Link>
        </div>
      </div>

      {/* Upload area */}
      <div className="mb-10">
        <div className="flex gap-4 mb-4">
          <div>
            <label className="field-label text-chesto-cream/50">Category</label>
            <select
              value={uploadCategory}
              onChange={e => { setCategory(e.target.value); setAlbum('') }}
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream"
            >
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
          {uploadAlbums.length > 0 && (
            <div>
              <label className="field-label text-chesto-cream/50">Album</label>
              <select
                value={album}
                onChange={e => setAlbum(e.target.value)}
                className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream"
              >
                <option value="">No album</option>
                {uploadAlbums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div
          className="border-2 border-dashed border-chesto-cream/20 hover:border-chesto-gold/40 transition-colors p-12 text-center cursor-pointer"
          onClick={() => fileRef.current.click()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          onDragOver={e => e.preventDefault()}
        >
          <p className="text-chesto-cream/40 text-sm mb-1">Drop photos here or click to browse</p>
          <p className="text-chesto-cream/20 text-xs">JPG, PNG, WebP · Multiple files supported</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mb-10 space-y-2">
          {uploads.filter(u => !u.done).map(u => (
            <div key={u.id} className="bg-chesto-charcoal/30 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-chesto-cream/60 text-xs font-mono truncate">{u.file.name}</span>
                <span className="text-chesto-cream/40 text-xs">{u.error ? '✗ Error' : `${u.progress}%`}</span>
              </div>
              <div className="h-1 bg-chesto-cream/10">
                <div className="h-1 bg-chesto-gold transition-all duration-300" style={{ width: `${u.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo grid by category; photos with a missing or deleted category show under Uncategorized */}
      {[...categories, { slug: UNCATEGORIZED, label: 'Uncategorized' }].map(cat => {
        const catPhotos = cat.slug === UNCATEGORIZED
          ? photos.filter(p => !categories.some(c => c.slug === p.category))
          : photos.filter(p => p.category === cat.slug)
        if (catPhotos.length === 0) return null
        const catAlbums = albumsIn(cat.slug)
        return (
          <div key={cat.slug} className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase">
                {cat.label} · {catPhotos.length}
              </h2>
              {selecting && (() => {
                const allOn = catPhotos.every(p => selected.has(p.id))
                return (
                  <button type="button" onClick={() => toggleSelected(catPhotos.map(p => p.id), !allOn)} className="text-xs text-chesto-gold hover:text-chesto-gold-light">
                    {allOn ? 'Deselect all' : 'Select all'}
                  </button>
                )
              })()}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {catPhotos.map(photo => (
                <div
                  key={photo.id}
                  className={`relative group aspect-square ${selecting ? 'cursor-pointer' : ''} ${selected.has(photo.id) ? 'ring-2 ring-chesto-gold' : ''}`}
                  onClick={selecting ? () => toggleSelected([photo.id]) : undefined}
                >
                  <img {...fixedImage(photo.url, 640)} loading="lazy" alt={photo.title} className={`w-full h-full object-cover transition-opacity ${selecting && !selected.has(photo.id) ? 'opacity-60' : ''}`} />
                  {selecting && (
                    <div className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-sm border-2 ${
                      selected.has(photo.id) ? 'bg-chesto-gold border-chesto-gold text-chesto-dark' : 'border-chesto-cream/80 bg-chesto-dark/40'
                    }`}>
                      {selected.has(photo.id) && '✓'}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    {covers[photo.category] === photo.url && (
                      <div className="bg-chesto-gold text-chesto-dark text-xs font-medium px-2 py-0.5">Cover</div>
                    )}
                    {photo.album && catAlbums.find(a => a.id === photo.album)?.cover === photo.url && (
                      <div className="bg-chesto-cream text-chesto-dark text-xs font-medium px-2 py-0.5">Album Cover</div>
                    )}
                  </div>
                  {!selecting && <div className="absolute inset-0 bg-chesto-dark/40 md:bg-chesto-dark/0 md:group-hover:bg-chesto-dark/60 transition-all duration-200 flex flex-col items-center justify-center gap-2">
                    {cat.slug !== UNCATEGORIZED && (
                      <button
                        onClick={() => setCover(photo)}
                        className="md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-chesto-gold text-chesto-dark text-xs px-3 py-1.5 font-body"
                      >
                        Set Cover
                      </button>
                    )}
                    {catAlbums.some(a => a.id === photo.album) && (
                      <button
                        onClick={() => setAlbumCover(photo)}
                        className="md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-chesto-cream text-chesto-dark text-xs px-3 py-1.5 font-body"
                      >
                        Set Album Cover
                      </button>
                    )}
                    <button
                      onClick={() => deletePhoto(photo)}
                      className="md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-600 text-white text-xs px-3 py-1.5 font-body"
                    >
                      Delete
                    </button>
                  </div>}
                  {!selecting && catAlbums.length > 0 && (() => {
                    const current = catAlbums.find(a => a.id === photo.album)
                    return (
                      <label className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] cursor-pointer">
                        <select
                          value={current ? current.id : ''}
                          onChange={e => movePhotoToAlbum(photo, e.target.value)}
                          className={`album-tag appearance-none max-w-full truncate pl-2.5 pr-6 py-1 ${current ? 'text-chesto-cream' : 'text-chesto-cream/50'}`}
                          aria-label="Album"
                        >
                          <option value="">No album</option>
                          {catAlbums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-chesto-cream/60" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <path d="M2 3.5 5 6.5 8 3.5" />
                        </svg>
                      </label>
                    )
                  })()}
                  {selecting && catAlbums.find(a => a.id === photo.album) && (
                    <span className="album-tag absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate px-2.5 py-1 text-chesto-cream">
                      {catAlbums.find(a => a.id === photo.album).title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Bulk actions */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-0 right-0 left-0 md:left-56 z-40 bg-chesto-charcoal border-t border-chesto-cream/10 px-6 py-4 flex flex-wrap items-center gap-3">
          <span className="text-chesto-cream text-sm font-medium mr-2">{selected.size} selected</span>
          <select
            value={bulkCategory}
            onChange={e => setBulkCategory(e.target.value)}
            className="field-input bg-chesto-dark border-chesto-cream/10 text-chesto-cream text-sm py-2 w-auto"
            aria-label="Category to move to"
          >
            <option value="">Choose a category…</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
          <button type="button" onClick={moveSelectedToCategory} disabled={!bulkCategory || bulkSaving} className="btn-gold text-sm disabled:opacity-50">
            {bulkSaving ? 'Saving…' : 'Move to Category'}
          </button>
          <span className="w-px h-6 bg-chesto-cream/10 mx-1" />
          {albums.length > 0 ? (
            <>
              <select
                value={bulkAlbum}
                onChange={e => setBulkAlbum(e.target.value)}
                className="field-input bg-chesto-dark border-chesto-cream/10 text-chesto-cream text-sm py-2 w-auto"
                aria-label="Album to add to"
              >
                <option value="">Choose an album…</option>
                {categories.map(c => {
                  const list = albumsIn(c.slug)
                  if (list.length === 0) return null
                  return (
                    <optgroup key={c.slug} label={c.label}>
                      {list.map(a => <option key={a.id} value={`${a.category}/${a.id}`}>{a.title}</option>)}
                    </optgroup>
                  )
                })}
              </select>
              <button type="button" onClick={addSelectedToAlbum} disabled={!bulkAlbum || bulkSaving} className="btn-gold text-sm disabled:opacity-50">
                {bulkSaving ? 'Saving…' : 'Add to Album'}
              </button>
            </>
          ) : (
            <Link to="/admin/photo-albums" className="text-sm text-chesto-gold hover:text-chesto-gold-light">Create an album first →</Link>
          )}
          {selectedPhotos.some(p => p.album) && (
            <button type="button" onClick={removeSelectedFromAlbums} disabled={bulkSaving} className="text-sm text-chesto-cream/60 hover:text-chesto-cream px-3 py-2 disabled:opacity-50">
              Remove from Album
            </button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="text-sm text-chesto-cream/40 hover:text-chesto-cream px-3 py-2 ml-auto">
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
