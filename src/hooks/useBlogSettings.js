import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_CATEGORIES = ['Photography', 'Cooking', 'Travel', 'Life', 'Gear', 'Other']

export function useBlogSettings() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'blog'), snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (Array.isArray(data.categories) && data.categories.length) {
          setCategories(data.categories)
        }
      }
      setLoading(false)
    })
  }, [])

  return { categories, loading }
}
