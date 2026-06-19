import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import RichTextEditor from '../../components/RichTextEditor'

const TMDB_W500 = 'https://image.tmdb.org/t/p/w500'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminReviewEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getDoc(doc(db, 'reviews', id)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        const ts = data.publishedAt ?? data.createdAt
        const publishedAt = ts?.toDate?.()?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]
        setForm({ ...data, publishedAt, published: data.published !== undefined ? data.published : true })
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const search = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(`/api/tmdb-search?query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults((data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 8))
    } catch (err) {
      console.error('TMDB search error', err)
    } finally {
      setSearching(false)
    }
  }

  const selectMedia = async (result) => {
    const { id: tmdbId, media_type: mediaType } = result
    setFetching(true)
    setSearchResults([])

    try {
      const detailRes = await fetch(`/api/tmdb-detail?id=${tmdbId}&type=${mediaType}`)
      const detail = await detailRes.json()

      const imdbId = detail.external_ids?.imdb_id || detail.imdb_id || null

      let imdbRating = '', rtRating = '', metacriticRating = ''
      if (imdbId) {
        try {
          const omdbRes = await fetch(`/api/omdb-lookup?imdbId=${imdbId}`)
          const omdb = await omdbRes.json()
          imdbRating = omdb.imdbRating && omdb.imdbRating !== 'N/A' ? omdb.imdbRating : ''
          const rt = (omdb.Ratings || []).find(r => r.Source === 'Rotten Tomatoes')
          const mc = (omdb.Ratings || []).find(r => r.Source === 'Metacritic')
          rtRating = rt?.Value || ''
          metacriticRating = mc?.Value || ''
        } catch (err) {
          console.error('OMDb error', err)
        }
      }

      const cast = (detail.credits?.cast || []).slice(0, 8).map(c => ({
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `${TMDB_W500}${c.profile_path}` : null,
      }))

      const title = detail.title || detail.name || ''
      const year = (detail.release_date || detail.first_air_date || '').split('-')[0]

      setForm({
        tmdbId,
        imdbId,
        mediaType,
        title,
        year,
        slug: `${slugify(title)}-${year}`,
        poster: detail.poster_path ? `${TMDB_W500}${detail.poster_path}` : '',
        backdrop: detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : '',
        overview: detail.overview || '',
        cast,
        director: mediaType === 'movie'
          ? (detail.credits?.crew || []).find(c => c.job === 'Director')?.name || ''
          : '',
        creator: mediaType === 'tv'
          ? (detail.created_by || []).map(c => c.name).join(', ')
          : '',
        genres: (detail.genres || []).map(g => g.name),
        runtime: mediaType === 'movie'
          ? (detail.runtime ? `${detail.runtime} min` : '')
          : (detail.number_of_seasons ? `${detail.number_of_seasons} season${detail.number_of_seasons !== 1 ? 's' : ''}` : ''),
        imdbRating,
        rtRating,
        metacriticRating,
        body: '',
        userRating: '',
        published: false,
        publishedAt: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      alert('Failed to load details: ' + err.message)
    } finally {
      setFetching(false)
    }
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async (shouldPublish) => {
    if (!form) return
    setSaving(true)
    try {
      const publishedAt = Timestamp.fromDate(new Date(form.publishedAt + 'T12:00:00'))
      const data = { ...form, publishedAt, published: shouldPublish, updatedAt: serverTimestamp() }
      if (isEdit) {
        await updateDoc(doc(db, 'reviews', id), data)
      } else {
        await addDoc(collection(db, 'reviews'), { ...data, createdAt: serverTimestamp() })
      }
      navigate('/admin/reviews')
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-chesto-cream/40 text-sm animate-pulse">Loading…</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/reviews" className="text-chesto-cream/40 hover:text-chesto-cream text-sm transition-colors">← Reviews</Link>
        <h1 className="font-display font-semibold text-3xl text-chesto-cream">{isEdit ? 'Edit Review' : 'New Review'}</h1>
      </div>

      {/* Search — new reviews only, before media selected */}
      {!isEdit && !form && (
        <div className="mb-10 max-w-2xl">
          <label className="field-label text-chesto-cream/50">Search for a movie or TV show</label>
          <div className="flex gap-3 mb-4">
            <input
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream flex-1"
              placeholder="e.g. The Godfather, Succession…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              autoFocus
            />
            <button onClick={search} disabled={searching} className="btn-gold disabled:opacity-50">
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {fetching && <p className="text-chesto-cream/40 text-sm animate-pulse">Loading details…</p>}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => selectMedia(r)} className="text-left group">
                  <div className="aspect-[2/3] overflow-hidden bg-chesto-charcoal/40 mb-2">
                    {r.poster_path ? (
                      <img
                        src={`${TMDB_W500}${r.poster_path}`}
                        alt={r.title || r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-chesto-cream/20 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <p className="text-chesto-cream text-xs font-body font-medium leading-snug line-clamp-2">{r.title || r.name}</p>
                  <p className="text-chesto-cream/30 text-xs font-mono mt-0.5">
                    {(r.release_date || r.first_air_date || '').split('-')[0]}
                    {' · '}{r.media_type === 'tv' ? 'TV' : 'Film'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      {form && (
        <div className="space-y-8 max-w-2xl">
          {/* Selected media header */}
          <div className="flex gap-5 bg-chesto-charcoal/20 p-4 border-l-2 border-chesto-gold/30">
            {form.poster && (
              <img src={form.poster} alt={form.title} className="w-14 h-20 object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-chesto-cream font-display font-semibold text-lg leading-snug">{form.title}</h2>
                <span className="text-xs font-mono text-chesto-cream/30 px-1.5 border border-chesto-cream/10">
                  {form.mediaType === 'tv' ? 'TV' : 'Film'}
                </span>
              </div>
              <p className="text-chesto-cream/40 text-xs font-mono mb-1">
                {form.year}{form.runtime ? ` · ${form.runtime}` : ''}
              </p>
              {form.genres.length > 0 && (
                <p className="text-chesto-cream/30 text-xs mb-2">{form.genres.join(', ')}</p>
              )}
              <div className="flex gap-4 flex-wrap">
                {form.imdbRating && <span className="text-chesto-gold text-xs font-mono">IMDB {form.imdbRating}</span>}
                {form.rtRating && <span className="text-red-400/80 text-xs font-mono">RT {form.rtRating}</span>}
                {form.metacriticRating && <span className="text-chesto-cream/30 text-xs font-mono">MC {form.metacriticRating}</span>}
              </div>
            </div>
            {!isEdit && (
              <button
                onClick={() => setForm(null)}
                className="text-chesto-cream/20 hover:text-chesto-cream text-xs self-start flex-shrink-0 transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="field-label text-chesto-cream/50">Slug (URL)</label>
            <input
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream font-mono text-sm"
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
            />
          </div>

          {/* Review date */}
          <div>
            <label className="field-label text-chesto-cream/50">Review Date</label>
            <input
              type="date"
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream font-mono text-sm [&::-webkit-calendar-picker-indicator]:invert"
              value={form.publishedAt}
              onChange={e => set('publishedAt', e.target.value)}
            />
          </div>

          {/* User rating */}
          <div>
            <label className="field-label text-chesto-cream/50">Your Rating (out of 10)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              className="field-input bg-chesto-charcoal border-chesto-cream/10 text-chesto-cream w-28"
              placeholder="8.5"
              value={form.userRating}
              onChange={e => set('userRating', e.target.value)}
            />
          </div>

          {/* Review body */}
          <div>
            <label className="field-label text-chesto-cream/50">Review</label>
            <RichTextEditor value={form.body} onChange={val => set('body', val)} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => handleSave(false)} disabled={saving} className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" onClick={() => handleSave(true)} disabled={saving} className="btn-gold disabled:opacity-50">
              {saving ? 'Saving…' : form.published ? 'Update' : 'Publish'}
            </button>
            <Link to="/admin/reviews" className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark">Cancel</Link>
          </div>
        </div>
      )}
    </div>
  )
}
