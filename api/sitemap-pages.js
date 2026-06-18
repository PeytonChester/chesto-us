import { xmlResponse, urlset } from './_firestore.js'

const SITE = 'https://chesto.us'

export default function handler(req, res) {
  xmlResponse(res, urlset([
    { loc: `${SITE}/`,            changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE}/photography`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/recipes`,     changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/blog`,        changefreq: 'weekly', priority: '0.8' },
  ]))
}
