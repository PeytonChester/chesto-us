import { firestoreGet, xmlResponse, urlset } from './_firestore.js'

const SITE = 'https://chesto.us'
const DEFAULT_SLUGS = ['wildlife', 'macro', 'street', 'architecture', 'sports', 'nature']

export default async function handler(req, res) {
  let slugs = DEFAULT_SLUGS

  const settings = await firestoreGet('settings/photography')
  if (settings) {
    const values = settings?.fields?.categories?.arrayValue?.values ?? []
    const parsed = values.map(v => v?.mapValue?.fields?.slug?.stringValue).filter(Boolean)
    if (parsed.length > 0) slugs = parsed
  }

  xmlResponse(res, urlset(
    slugs.map(s => ({ loc: `${SITE}/photography/${s}`, changefreq: 'weekly', priority: '0.6' }))
  ))
}
