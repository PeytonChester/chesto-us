import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
const SP = '/tmp/claude-0/-home-user-chesto-us/50df267a-32fa-5399-8230-1ad6d15abef9/scratchpad'
export default defineConfig({
  root: '/home/user/chesto-us',
  plugins: [react(), {
    name: 'mock', enforce: 'pre',
    resolveId(id, importer) {
      if (id === 'firebase/firestore') return SP + '/mock/firestore.js'
      if (importer && !importer.includes('scratchpad') && /(^|\/)firebase$/.test(id) && id.startsWith('.')) return SP + '/mock/firebase.js'
      if (importer && /hooks\/useAuth$/.test(id)) return SP + '/mock/useAuth.js'
      return null
    },
  }],
  server: { port: 5198, fs: { allow: ['/home/user/chesto-us', SP] } },
})
