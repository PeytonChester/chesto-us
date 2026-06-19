export default async function handler(req, res) {
  const { id, type } = req.query
  if (!id || !type) return res.status(400).json({ error: 'id and type required' })

  const response = await fetch(
    `https://api.themoviedb.org/3/${type}/${id}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,external_ids`
  )
  const data = await response.json()
  res.status(response.ok ? 200 : response.status).json(data)
}
