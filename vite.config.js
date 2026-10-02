import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inline the entry stylesheet into index.html. A <link rel="stylesheet">
// blocks the first paint until it downloads, which costs a full extra round
// trip on slow mobile connections; inlined, the page (including the pre-JS
// copy of the home hero) can paint as soon as the HTML arrives.
function inlineEntryCss() {
  return {
    name: 'inline-entry-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html']
      if (!html) return
      for (const [fileName, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !fileName.endsWith('.css')) continue
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="/${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
        if (!link.test(html.source)) continue
        html.source = html.source.replace(link, () => `<style>${file.source}</style>`)
        delete bundle[fileName]
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineEntryCss()],
  server: {
    allowedHosts: 'all',
  },
  build: {
    chunkSizeWarningLimit: 800,
  },
})
