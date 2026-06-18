const SITE = 'https://chesto.us'
const DEFAULT_CATEGORY_SLUGS = ['wildlife', 'macro', 'street', 'architecture', 'sports', 'nature']

function stringField(doc, key) {
  return doc?.fields?.[key]?.stringValue ?? null
}

export default async function handler(req, res) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID
  const apiKey = process.env.VITE_FIREBASE_API_KEY
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  const q = `?key=${apiKey}`

  const [settingsRes, recipesRes, postsRes] = await Promise.all([
    fetch(`${base}/settings/photography${q}`),
    fetch(`${base}/recipes${q}&pageSize=500`),
    fetch(`${base}/posts${q}&pageSize=500`),
  ])

  // Categories — fall back to defaults if the settings doc doesn't exist yet
  let categorySlugs = DEFAULT_CATEGORY_SLUGS
  if (settingsRes.ok) {
    const data = await settingsRes.json()
    const values = data?.fields?.categories?.arrayValue?.values ?? []
    const slugs = values.map(v => v?.mapValue?.fields?.slug?.stringValue).filter(Boolean)
    if (slugs.length > 0) categorySlugs = slugs
  }

  // Recipe slugs
  let recipeSlugs = []
  if (recipesRes.ok) {
    const data = await recipesRes.json()
    recipeSlugs = (data.documents ?? []).map(d => stringField(d, 'slug')).filter(Boolean)
  }

  // Blog post slugs
  let postSlugs = []
  if (postsRes.ok) {
    const data = await postsRes.json()
    postSlugs = (data.documents ?? []).map(d => stringField(d, 'slug')).filter(Boolean)
  }

  const urls = [
    { loc: `${SITE}/`,            priority: '1.0', changefreq: 'weekly'  },
    { loc: `${SITE}/photography`, priority: '0.8', changefreq: 'weekly'  },
    ...categorySlugs.map(s => ({ loc: `${SITE}/photography/${s}`, priority: '0.6', changefreq: 'weekly'  })),
    { loc: `${SITE}/recipes`,     priority: '0.8', changefreq: 'weekly'  },
    ...recipeSlugs.map(s  => ({ loc: `${SITE}/recipes/${s}`,      priority: '0.7', changefreq: 'monthly' })),
    { loc: `${SITE}/blog`,        priority: '0.8', changefreq: 'weekly'  },
    ...postSlugs.map(s    => ({ loc: `${SITE}/blog/${s}`,          priority: '0.7', changefreq: 'monthly' })),
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    '</urlset>',
  ].join('\n')

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
