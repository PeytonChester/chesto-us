import { geolocation, next } from '@vercel/functions'

// Vercel Routing Middleware: runs at the edge before every request.
// Visitors from these countries (ISO 3166-1 alpha-2 codes, as detected
// from their IP address by Vercel) get a 403 instead of the site.
export const BLOCKED_COUNTRIES = new Set(['CN', 'SG'])

export default function middleware(request) {
  const { country } = geolocation(request)
  if (country && BLOCKED_COUNTRIES.has(country)) {
    return new Response('Access denied', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
  return next()
}
