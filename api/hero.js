import { firestoreGet, getString } from './_firestore.js'

// Edge runtime: starts in milliseconds, where a cold Node function could add
// a second or more before the hero (the home page's LCP element) even starts.
export const config = { runtime: 'edge' }

// /api/hero?w=1080 redirects to the current home page hero photo, resized
// by Vercel Image Optimization. index.html preloads it before any JS runs,
// so the hero no longer waits for the app bundle and a Firestore round trip.
// Widths match images.sizes in vercel.json.
const WIDTHS = [384, 640, 1080, 1920, 2560, 3840]

// Edge-cache briefly so admin changes show up within about a minute
const CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400'

export default async function handler(request) {
  const requested = Number(new URL(request.url).searchParams.get('w')) || 1080
  const width = WIDTHS.find(w => w >= requested) ?? WIDTHS[WIDTHS.length - 1]

  const url = getString(await firestoreGet('settings/home'), 'heroImageUrl')
  const notFound = () => new Response('No hero image', { status: 404, headers: { 'Cache-Control': CACHE } })
  if (!url) return notFound()

  let target = url
  try {
    const { hostname, pathname } = new URL(url)
    // Must match images.remotePatterns in vercel.json
    if (hostname === 'firebasestorage.googleapis.com' && pathname.startsWith('/v0/b/chesto-us.firebasestorage.app/o/')) {
      target = `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=75`
    }
  } catch {
    return notFound()
  }
  return new Response(null, { status: 307, headers: { Location: target, 'Cache-Control': CACHE } })
}
