import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

// `max` caps how many documents are downloaded (newest first by default)
export function useCollection(collectionName, orderByField = 'createdAt', direction = 'desc', max = null) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, direction),
      ...(max ? [limit(max)] : [])
    )

    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error(err)
      setError(err.message)
      setLoading(false)
    })

    return unsub
  }, [collectionName, orderByField, direction, max])

  return { docs, loading, error }
}
