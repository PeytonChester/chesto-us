import { firestoreGet, firestoreList, getString, xmlResponse, urlset } from './_firestore.js'

const SITE = 'https://chesto.us'
const DEFAULT_SLUGS = ['wildlife', 'macro', 'street', 'architecture', 'sports', 'nature']

export default async function handler(req, res) {
  let slugs = DEFAULT_SLUGS
  let albums = []

  const [settings, photos] = await Promise.all([firestoreGet('settings/photography'), firestoreList('photos')])
  if (settings) {
    const values = settings?.fields?.categories?.arrayValue?.values ?? []
    const parsed = values.map(v => v?.mapValue?.fields?.slug?.stringValue).filter(Boolean)
    if (parsed.length > 0) slugs = parsed

    albums = (settings?.fields?.albums?.arrayValue?.values ?? [])
      .map(v => v?.mapValue?.fields)
      .map(f => ({ id: f?.id?.stringValue, category: f?.category?.stringValue }))
      .filter(a => a.id && slugs.includes(a.category))
  }

  // Leave out categories and albums with no photos (they're hidden on the site)
  if (photos.length > 0 && photos.length < 500) {
    const used = new Set(photos.map(p => getString(p, 'category')))
    const usedAlbums = new Set(photos.map(p => `${getString(p, 'category')}/${getString(p, 'album')}`))
    slugs = slugs.filter(s => used.has(s))
    albums = albums.filter(a => usedAlbums.has(`${a.category}/${a.id}`))
  }

  xmlResponse(res, urlset([
    ...slugs.map(s => ({ loc: `${SITE}/photography/${s}`, changefreq: 'weekly', priority: '0.6' })),
    ...albums.map(a => ({ loc: `${SITE}/photography/${a.category}/${a.id}`, changefreq: 'monthly', priority: '0.5' })),
  ]))
}
