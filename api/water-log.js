import { loadWaterLog, waterLogJson, waterLogMarkdown } from './_waterLog.js'

// /queso-water-log.json and /queso-water-log.md (rewritten here in
// vercel.json): the whole water log as data, for tools that read the page
// without running JS. noindex like the page itself.
export default async function handler(req, res) {
  const markdown = req.query.format === 'md'
  res.setHeader('X-Robots-Tag', 'noindex')
  res.setHeader('Access-Control-Allow-Origin', '*')
  let log
  try {
    log = await loadWaterLog()
  } catch (err) {
    console.error('water-log', err)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(502).send('The water log could not be loaded. Try again shortly.')
  }
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400')
  if (markdown) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    return res.status(200).send(waterLogMarkdown(log))
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(200).send(JSON.stringify(waterLogJson(log), null, 2))
}
