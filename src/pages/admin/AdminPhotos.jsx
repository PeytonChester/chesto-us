import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { storage, db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'

const CATEGORIES = ['wildlife', 'macro', 'street', 'architecture', 'sports', 'nature']

export default function AdminPhotos() {
  const { docs: photos } = useCollection('photos', 'createdAt', 'desc')
  const [uploads, setUploads] = useState([]) // { file, progress, category, title, done, error }
  const [category, setCategory] = useState('wildlife')
  const fileRef = useRef()

  const handleFiles = (files) => {
    const items = Array.from(files).map(file => ({
      file, progress: 0, category, title: '', done: false, error: null, id: Math.random().toString(36).slice(2)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-1">Photos</h1>
          <p className="text-chesto-cream/40 text-sm">{photos.length} photos in library</p>
        </div>
      </div>

      {/* Upload area */}
      <div className="mb-10">
        <div className="flex gap-4 mb-4">
          <div>
            <label className="field-label text-chesto-cream/50">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
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

      {/* Photo grid by category */}
      {CATEGORIES.map(cat => {
        const catPhotos = photos.filter(p => p.category === cat)
        if (catPhotos.length === 0) return null
        return (
          <div key={cat} className="mb-12">
            <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">
              {cat.charAt(0).toUpperCase() + cat.slice(1)} · {catPhotos.length}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {catPhotos.map(photo => (
                <div key={photo.id} className="relative group aspect-square">
                  <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-chesto-dark/0 group-hover:bg-chesto-dark/60 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={() => deletePhoto(photo)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white text-xs px-3 py-1.5 font-body"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
