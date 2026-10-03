import { firestoreGet, FIRESTORE_BASE, FIRESTORE_KEY } from './_firestore.js'

// Server-side page tags for link previews and search engines. The app sets
// the same tags with react-helmet-async (src/components/PageMeta.jsx), but
// link-preview bots (iMessage, Facebook, Slack, Discord...) don't run JS, so
// /api/page puts them into the HTML before it's sent. Keep the titles and
// descriptions here in step with the pages' <PageMeta> props.

export const SITE = 'https://www.chesto.us'
const SITE_NAME = 'Chesto.us'
const DEFAULT_DESCRIPTION = 'Photography, recipes, and stories by Peyton Chester.'
const AUTHOR = { '@type': 'Person', name: 'Peyton Chester', url: SITE }

// Same fallback as src/hooks/usePhotographySettings.js
const DEFAULT_PHOTO_CATEGORIES = [
  { slug: 'wildlife', label: 'Wildlife' },
  { slug: 'macro', label: 'Macro' },
  { slug: 'street', label: 'Street' },
  { slug: 'architecture', label: 'Architecture' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'nature', label: 'Nature' },
]

const LIST_PAGES = {
  '/': { description: DEFAULT_DESCRIPTION, image: `${SITE}/api/hero?w=1920` },
  '/photography': { title: 'Photography', description: 'From wide landscapes to tight macro details — a collection of moments worth keeping.' },
  '/recipes': { title: 'Recipes', description: 'Recipes from the kitchen — breakfasts, dinners, desserts, and more.' },
  '/blog': { title: 'Blog', description: 'Writing on photography, food, and life.' },
  '/reviews': { title: 'Movie & TV Reviews', description: "Peyton's reviews of movies and TV shows — with ratings, cast, and honest takes." },
}

const NOT_FOUND = {
  status: 404,
  title: 'Page Not Found',
  description: "The page you're looking for doesn't exist or may have moved.",
  noindex: true,
}

/** Firestore REST value -> plain JS value */
export function fromValue(v) {
  if (!v) return undefined
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('booleanValue' in v) return v.booleanValue
  if ('timestampValue' in v) return v.timestampValue
  if ('nullValue' in v) return null
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromValue)
  if ('mapValue' in v) return fromFields(v.mapValue.fields)
  return undefined
}

export function fromFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromValue(v)]))
}

async function findBySlug(collection, slug) {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery${FIRESTORE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
        limit: 1,
      },
    }),
  })
  if (!res.ok) throw new Error(`Firestore query failed: ${res.status}`)
  const rows = await res.json()
  const doc = rows.find(r => r.document)?.document
  if (!doc) return null
  const data = fromFields(doc.fields)
  return data.published === false ? null : data
}

// Shared links should use the same resized file the site shows, not the
// multi-megabyte original. Mirrors optimizedUrl() in src/lib/images.js.
export function shareImage(url) {
  if (!url) return undefined
  if (url.startsWith('https://firebasestorage.googleapis.com/v0/b/chesto-us.firebasestorage.app/o/')) {
    return `${SITE}/_vercel/image?url=${encodeURIComponent(url)}&w=1080&q=75`
  }
  const tmdb = url.match(/^(https:\/\/image\.tmdb\.org\/t\/p\/)[^/]+(\/.+)$/)
  if (tmdb) return `${tmdb[1]}w1280${tmdb[2]}`
  return url
}

// "30" (minutes, as the recipe editor stores it) -> "PT30M"
function isoMinutes(value) {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? `PT${n}M` : undefined
}

function stripHtml(html) {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function recipeJsonLd(r, url) {
  const groups = r.ingredientGroups ?? (r.ingredients?.length ? [{ items: r.ingredients }] : [])
  const ingredients = groups.flatMap(g => g.items ?? [])
    .map(i => [i.amount, i.unit, i.name].filter(Boolean).join(' '))
    .filter(Boolean)
  const steps = (r.instructions ?? []).map(step => {
    const text = typeof step === 'string' ? step : step.text
    const substeps = typeof step === 'string' ? [] : (step.substeps ?? [])
    return { '@type': 'HowToStep', text: [text, ...substeps].filter(Boolean).join(' ') }
  })
  const prep = parseInt(r.prepTime, 10)
  const cook = parseInt(r.cookTime, 10)
  const total = (Number.isFinite(prep) ? prep : 0) + (Number.isFinite(cook) ? cook : 0)
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.excerpt || undefined,
    image: r.imageUrl ? [shareImage(r.imageUrl)] : undefined,
    author: AUTHOR,
    datePublished: r.publishedAt ?? r.createdAt,
    recipeCategory: r.category || undefined,
    recipeYield: r.servings ? `${r.servings} servings` : undefined,
    prepTime: isoMinutes(r.prepTime),
    cookTime: isoMinutes(r.cookTime),
    totalTime: total > 0 ? `PT${total}M` : undefined,
    recipeIngredient: ingredients.length ? ingredients : undefined,
    recipeInstructions: steps.length ? steps : undefined,
    url,
  }
}

export function postJsonLd(p, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt || undefined,
    image: p.imageUrl ? [shareImage(p.imageUrl)] : undefined,
    author: AUTHOR,
    datePublished: p.publishedAt ?? p.createdAt,
    dateModified: p.updatedAt ?? undefined,
    articleSection: p.category || undefined,
    mainEntityOfPage: url,
  }
}

export function reviewJsonLd(r, url) {
  const rating = parseFloat(r.userRating)
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: `${r.title} (${r.year}) Review`,
    url,
    author: AUTHOR,
    datePublished: r.publishedAt ?? r.createdAt,
    reviewBody: stripHtml(r.body).slice(0, 500) || undefined,
    itemReviewed: {
      '@type': r.mediaType === 'tv' ? 'TVSeries' : 'Movie',
      name: r.title,
      image: r.poster || undefined,
      ...(r.mediaType === 'tv'
        ? { startDate: r.year || undefined }
        : { dateCreated: r.year || undefined, director: r.director ? { '@type': 'Person', name: r.director } : undefined }),
    },
    reviewRating: Number.isFinite(rating)
      ? { '@type': 'Rating', ratingValue: rating, bestRating: 10, worstRating: 0 }
      : undefined,
  }
}

/**
 * What to send for a path: { status, title, description, image, type,
 * jsonLd, noindex }. Returns status 200 with the site defaults when Firestore
 * can't be reached, so an outage never turns real pages into 404s.
 */
export async function pageMeta(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (LIST_PAGES[path]) return { status: 200, ...LIST_PAGES[path] }
  if (path === '/admin' || path.startsWith('/admin/')) return { status: 200, noindex: true }

  const parts = path.split('/').filter(Boolean).map(decodeURIComponent)
  const url = `${SITE}${path}`
  try {
    if (parts.length === 2 && parts[0] === 'recipes') {
      const r = await findBySlug('recipes', parts[1])
      if (!r) return NOT_FOUND
      return { status: 200, title: r.title, description: r.excerpt, image: shareImage(r.imageUrl), jsonLd: recipeJsonLd(r, url) }
    }
    if (parts.length === 2 && parts[0] === 'blog') {
      const p = await findBySlug('posts', parts[1])
      if (!p) return NOT_FOUND
      return {
        status: 200, title: p.title, description: p.excerpt, image: shareImage(p.imageUrl), type: 'article',
        publishedTime: p.publishedAt ?? p.createdAt, jsonLd: postJsonLd(p, url),
      }
    }
    if (parts.length === 2 && parts[0] === 'reviews') {
      const r = await findBySlug('reviews', parts[1])
      if (!r) return NOT_FOUND
      return {
        status: 200, title: `${r.title} (${r.year}) Review`, description: r.overview, image: shareImage(r.backdrop || r.poster),
        type: 'article', publishedTime: r.publishedAt ?? r.createdAt, jsonLd: reviewJsonLd(r, url),
      }
    }
    if ((parts.length === 2 || parts.length === 3) && parts[0] === 'photography') {
      const doc = await firestoreGet('settings/photography')
      const settings = fromFields(doc?.fields)
      const categories = settings.categories?.length ? settings.categories : DEFAULT_PHOTO_CATEGORIES
      const cat = categories.find(c => c.slug === parts[1])
      if (!cat) return NOT_FOUND
      if (parts.length === 2) {
        return { status: 200, title: `${cat.label} Photography`, description: `Browse ${cat.label.toLowerCase()} photography on Chesto.us.`, image: shareImage(settings.covers?.[cat.slug]) }
      }
      const album = (settings.albums ?? []).find(a => a.category === cat.slug && a.id === parts[2])
      if (!album) return NOT_FOUND
      return {
        status: 200, title: `${album.title} · ${cat.label} Photography`,
        description: `${album.title} — ${cat.label.toLowerCase()} photography on Chesto.us.`, image: shareImage(album.cover),
      }
    }
  } catch (err) {
    console.error('pageMeta', path, err)
    return { status: 200 }
  }
  return NOT_FOUND
}

const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// JSON-LD sits in a <script>; escape "<" so text like "</script>" can't end it
const jsonForScript = obj => JSON.stringify(obj).replace(/</g, '\\u003c')

// Search results and link cards show ~160-200 characters; cut at a word
function truncate(text, max) {
  if (text.length <= max) return text
  return text.slice(0, text.lastIndexOf(' ', max - 1)).replace(/[\s,;:.—-]+$/, '') + '…'
}

/** The <head> tags for a page. data-rh lets react-helmet-async replace them once the app loads. */
export function headTags(meta, pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const title = meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} | Photography, Recipes & Stories`
  const desc = truncate(meta.description || DEFAULT_DESCRIPTION, 200)
  const url = `${SITE}${path}`
  const tag = (name, attrs) => `<${name} data-rh="true" ${Object.entries(attrs).map(([k, v]) => `${k}="${escapeHtml(v)}"`).join(' ')} />`
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    tag('meta', { name: 'description', content: desc }),
    meta.status === 404 ? null : tag('link', { rel: 'canonical', href: url }),
    meta.noindex ? tag('meta', { name: 'robots', content: 'noindex' }) : null,
    tag('meta', { property: 'og:site_name', content: SITE_NAME }),
    tag('meta', { property: 'og:title', content: title }),
    tag('meta', { property: 'og:description', content: desc }),
    tag('meta', { property: 'og:url', content: url }),
    tag('meta', { property: 'og:type', content: meta.type || 'website' }),
    meta.publishedTime ? tag('meta', { property: 'article:published_time', content: meta.publishedTime }) : null,
    meta.image ? tag('meta', { property: 'og:image', content: meta.image }) : null,
    tag('meta', { name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary' }),
    tag('meta', { name: 'twitter:title', content: title }),
    tag('meta', { name: 'twitter:description', content: desc }),
    meta.image ? tag('meta', { name: 'twitter:image', content: meta.image }) : null,
    meta.jsonLd ? `<script type="application/ld+json">${jsonForScript(meta.jsonLd)}</script>` : null,
  ]
  return tags.filter(Boolean).join('\n    ')
}

/** Swap index.html's page-meta block (the home page's tags) for this page's */
export function injectHead(html, tags) {
  const block = /<!-- page-meta:[\s\S]*?<!-- \/page-meta -->/
  if (!block.test(html)) throw new Error('index.html has no page-meta block')
  return html.replace(block, () => tags)
}
