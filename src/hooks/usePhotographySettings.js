import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_CATEGORIES = [
  { slug: 'wildlife',     label: 'Wildlife',      description: 'Animals in their element' },
  { slug: 'macro',        label: 'Macro',          description: 'The world up close' },
  { slug: 'street',       label: 'Street',         description: 'City life and candid moments' },
  { slug: 'architecture', label: 'Architecture',   description: 'Form, light, and structure' },
  { slug: 'sports',       label: 'Sports',         description: 'Motion and energy' },
  { slug: 'nature',       label: 'Nature',         description: 'Landscapes and the outdoors' },
]

export function usePhotographySettings() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [covers, setCovers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'photography'), snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.categories?.length) setCategories(data.categories)
        setCovers(data.covers || {})
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return { categories, covers, loading }
}
