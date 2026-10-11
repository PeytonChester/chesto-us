import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { WATER_LOG_DOC, readingsFrom } from '../lib/waterLog'

export function useWaterLog() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(doc(db, ...WATER_LOG_DOC), snap => {
      setReadings(readingsFrom(snap.data()))
      setLoading(false)
    }, err => {
      console.error(err)
      setError(err.message)
      setLoading(false)
    })
  }, [])

  return { readings, loading, error }
}
