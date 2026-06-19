const BASE = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`
const KEY = `?key=${process.env.VITE_FIREBASE_API_KEY}`

export async function firestoreGet(path) {
  const res = await fetch(`${BASE}/${path}${KEY}`)
  return res.ok ? res.json() : null
}

export async function firestoreList(collection) {
  const res = await fetch(`${BASE}/${collection}${KEY}&pageSize=500`)
  if (!res.ok) return []
  const data = await res.json()
  return data.documents ?? []
}

export function getBoolean(doc, field) {
  const val = doc?.fields?.[field]?.booleanValue
  return val // undefined if field absent, true/false if set
}

export function getString(doc, field) {
  return doc?.fields?.[field]?.stringValue ?? null
}

export function getDate(doc, field) {
  const ts = doc?.fields?.[field]?.timestampValue
  return ts ? ts.split('T')[0] : null
}

export function xmlResponse(res, xml) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}

export function urlset(urls) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => {
      const lines = [`  <url>`, `    <loc>${u.loc}</loc>`]
      if (u.lastmod)    lines.push(`    <lastmod>${u.lastmod}</lastmod>`)
      if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`)
      if (u.priority)   lines.push(`    <priority>${u.priority}</priority>`)
      lines.push(`  </url>`)
      return lines.join('\n')
    }),
    '</urlset>',
  ].join('\n')
}
