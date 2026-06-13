import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export function useCollection(collectionName, orderByField = 'createdAt', direction = 'desc') {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, direction)
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
  }, [collectionName, orderByField, direction])

  return { docs, loading, error }
}
