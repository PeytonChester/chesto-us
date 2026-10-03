import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pageMeta, headTags, injectHead } from './_seo.js'

// Every page except the home page is served through here (see the rewrite
// in vercel.json): the built index.html with that page's title,
// description, link-preview tags and structured data filled in, and a real
// 404 status for URLs that don't exist. The app then boots as usual.
// "/" is still the static index.html, which already carries the home tags.

let template
async function loadTemplate() {
  // dist/index.html is bundled with this function (includeFiles in vercel.json)
  template ??= await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  return template
}

export default async function handler(req, res) {
  const path = typeof req.query.path === 'string' && req.query.path.startsWith('/') ? req.query.path : '/'
  const html = await loadTemplate()
  const meta = await pageMeta(path)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Cached at the edge (cleared on every deploy); edits in the admin panel
  // show up in link previews within ~10 minutes.
  res.setHeader('Cache-Control', meta.status === 200
    ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
    : 'public, max-age=0, s-maxage=60')
  res.status(meta.status).send(injectHead(html, headTags(meta, path)))
}
