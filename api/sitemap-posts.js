import { firestoreList, getString, getDate, xmlResponse, urlset } from './_firestore.js'

const SITE = 'https://chesto.us'

export default async function handler(req, res) {
  const docs = await firestoreList('posts')

  const urls = docs
    .map(d => ({
      slug: getString(d, 'slug'),
      lastmod: getDate(d, 'updatedAt') ?? getDate(d, 'createdAt'),
    }))
    .filter(p => p.slug)
    .map(p => ({
      loc: `${SITE}/blog/${p.slug}`,
      lastmod: p.lastmod,
      changefreq: 'monthly',
      priority: '0.7',
    }))

  xmlResponse(res, urlset(urls))
}
