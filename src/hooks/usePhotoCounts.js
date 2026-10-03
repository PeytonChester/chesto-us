import { useState, useEffect } from 'react'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '../firebase'

// Number of photos in each category, counted by Firestore instead of
// downloading every photo document. Returns { [slug]: count }.
export function usePhotoCounts(slugs) {
  const [counts, setCounts] = useState({})
  const key = slugs.join(',')

  useEffect(() => {
    let cancelled = false
    const list = key ? key.split(',') : []
    Promise.all(list.map(slug =>
      getCountFromServer(query(collection(db, 'photos'), where('category', '==', slug)))
        .then(snap => [slug, snap.data().count])
        .catch(err => { console.error(err); return [slug, 0] })
    )).then(entries => { if (!cancelled) setCounts(Object.fromEntries(entries)) })
    return () => { cancelled = true }
  }, [key])

  return counts
}
