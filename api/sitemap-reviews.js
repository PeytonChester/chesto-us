import { firestoreList, getString, getDate, getBoolean, xmlResponse, urlset } from './_firestore.js'

const SITE = 'https://chesto.us'

export default async function handler(req, res) {
  const docs = await firestoreList('reviews')

  const urls = docs
    .map(d => ({
      slug: getString(d, 'slug'),
      lastmod: getDate(d, 'updatedAt') ?? getDate(d, 'createdAt'),
      published: getBoolean(d, 'published'),
    }))
    .filter(r => r.slug && r.published !== false)
    .map(r => ({
      loc: `${SITE}/reviews/${r.slug}`,
      lastmod: r.lastmod,
      changefreq: 'monthly',
      priority: '0.6',
    }))

  xmlResponse(res, urlset(urls))
}
