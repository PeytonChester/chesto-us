export default async function handler(req, res) {
  const { query } = req.query
  if (!query) return res.status(400).json({ error: 'query required' })

  const response = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
  )
  const data = await response.json()
  res.status(response.ok ? 200 : response.status).json(data)
}
