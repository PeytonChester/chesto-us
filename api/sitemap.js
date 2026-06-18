import { xmlResponse } from './_firestore.js'

const SITE = 'https://chesto.us'

export default function handler(req, res) {
  const sitemaps = ['sitemap-pages', 'sitemap-photography', 'sitemap-recipes', 'sitemap-posts']

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map(s => `  <sitemap>\n    <loc>${SITE}/${s}.xml</loc>\n  </sitemap>`),
    '</sitemapindex>',
  ].join('\n')

  xmlResponse(res, xml)
}
