export default async function handler(req, res) {
  const { imdbId } = req.query
  if (!imdbId) return res.status(400).json({ error: 'imdbId required' })

  const response = await fetch(
    `https://www.omdbapi.com/?i=${imdbId}&apikey=${process.env.OMDB_API_KEY}`
  )
  const data = await response.json()
  res.status(response.ok ? 200 : response.status).json(data)
}
