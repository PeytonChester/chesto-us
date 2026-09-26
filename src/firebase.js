// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Create a Firebase project at https://console.firebase.google.com
// Enable: Firestore, Storage, Authentication (Email/Password)
// Then replace the config below with your project's values.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db      = getFirestore(app)
// Storage and Auth live in firebaseStorage.js / firebaseAuth.js so public
// pages don't download them
export default app
