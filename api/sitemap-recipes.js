import { firestoreList, getString, getDate, xmlResponse, urlset } from './_firestore.js'

const SITE = 'https://chesto.us'

export default async function handler(req, res) {
  const docs = await firestoreList('recipes')

  const urls = docs
    .map(d => ({
      slug: getString(d, 'slug'),
      lastmod: getDate(d, 'updatedAt') ?? getDate(d, 'createdAt'),
    }))
    .filter(r => r.slug)
    .map(r => ({
      loc: `${SITE}/recipes/${r.slug}`,
      lastmod: r.lastmod,
      changefreq: 'monthly',
      priority: '0.7',
    }))

  xmlResponse(res, urlset(urls))
}
