import { firestoreGet, getString } from './_firestore.js'

// Edge runtime: starts in milliseconds, where a cold Node function could add
// a second or more before the hero (the home page's LCP element) even starts.
export const config = { runtime: 'edge' }

// /api/hero?w=1080 returns the current home page hero photo, resized by Vercel
// Image Optimization. index.html loads it before any JS runs. The resized
// image is fetched here and returned directly (not redirected to), saving the
// browser two round trips, and the CDN caches the result.
// Widths match images.sizes in vercel.json.
const WIDTHS = [384, 640, 1080, 1920, 2560, 3840]

// Edge-cache briefly so admin changes show up within about a minute
const CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400'

const redirect = (location) => new Response(null, { status: 307, headers: { Location: location, 'Cache-Control': CACHE } })

export default async function handler(request) {
  const requested = Number(new URL(request.url).searchParams.get('w')) || 1080
  const width = WIDTHS.find(w => w >= requested) ?? WIDTHS[WIDTHS.length - 1]

  const url = getString(await firestoreGet('settings/home'), 'heroImageUrl')
  if (!url) return new Response('No hero image', { status: 404, headers: { 'Cache-Control': CACHE } })

  let optimizable = false
  try {
    const { hostname, pathname } = new URL(url)
    // Must match images.remotePatterns in vercel.json
    optimizable = hostname === 'firebasestorage.googleapis.com' && pathname.startsWith('/v0/b/chesto-us.firebasestorage.app/o/')
  } catch {
    return new Response('No hero image', { status: 404, headers: { 'Cache-Control': CACHE } })
  }
  if (!optimizable) return redirect(url)

  const optimized = `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=75`
  try {
    const res = await fetch(new URL(optimized, request.url), {
      headers: { Accept: request.headers.get('accept') || 'image/webp,image/*,*/*;q=0.8' },
    })
    if (!res.ok) throw new Error(`optimizer ${res.status}`)
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/webp',
        'Cache-Control': CACHE,
        Vary: 'Accept',
      },
    })
  } catch {
    // Optimizer unreachable (e.g. a protected preview deployment): let the
    // browser fetch it, as before
    return redirect(optimized)
  }
}
