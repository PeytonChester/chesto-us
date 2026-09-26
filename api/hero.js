import { firestoreGet, getString } from './_firestore.js'

// /api/hero?w=1080 redirects to the current home page hero photo, resized
// by Vercel Image Optimization. index.html preloads it before any JS runs,
// so the hero (the home page's LCP element) no longer waits for the app
// bundle and a Firestore round trip. Widths match images.sizes in vercel.json.
const WIDTHS = [384, 640, 1080, 1920, 2560, 3840]

export default async function handler(req, res) {
  const requested = Number(req.query.w) || 1080
  const width = WIDTHS.find(w => w >= requested) ?? WIDTHS[WIDTHS.length - 1]

  const url = getString(await firestoreGet('settings/home'), 'heroImageUrl')
  // Edge-cache briefly so admin changes show up within about a minute
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400')
  if (!url) return res.status(404).send('No hero image')

  let target = url
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname === 'firebasestorage.googleapis.com' && pathname.startsWith('/v0/b/chesto-us')) {
      target = `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=75`
    }
  } catch {
    return res.status(404).send('No hero image')
  }
  res.setHeader('Location', target)
  res.status(307).end()
}
