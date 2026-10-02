import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'
import { warmImages, HERO_WIDTHS } from '../../lib/images'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons'

// Has Vercel create the common sizes of every site image up front, so
// visitors aren't the first to request (and wait for) a resize
function PrepareImages({ photos, recipes, posts }) {
  const [progress, setProgress] = useState(null) // { done, total } while running
  const [result, setResult] = useState(null)

  const run = async () => {
    setResult(null)
    setProgress({ done: 0, total: 0 })
    const onProgress = (done, total) => setProgress({ done, total })
    const covers = [...recipes, ...posts].map(d => d.imageUrl).filter(Boolean)
    const main = await warmImages([...photos.map(p => p.url), ...covers], { onProgress })
    const hero = (await getDoc(doc(db, 'settings', 'home'))).data()?.heroImageUrl
    const heroResult = hero ? await warmImages([hero], { widths: HERO_WIDTHS }) : { total: 0, failed: 0 }
    setProgress(null)
    setResult({ total: main.total + heroResult.total, failed: main.failed + heroResult.failed })
  }

  return (
    <div className="mt-12 bg-chesto-charcoal/40 border border-chesto-cream/10 p-6">
      <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-2">Image speed</h2>
      <p className="text-chesto-cream/60 text-sm font-body mb-4 max-w-xl">
        Prepares every photo, cover and the home hero in the sizes visitors load, so pages don't wait on first-time resizing.
        New uploads are prepared automatically; run this once for existing images, or after a big batch.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={run} disabled={!!progress} className="btn-gold text-xs disabled:opacity-60">
          <FontAwesomeIcon icon={faBolt} className="mr-2" />
          {progress ? 'Preparing…' : 'Prepare Images'}
        </button>
        {progress && progress.total > 0 && (
          <span className="text-chesto-cream/50 text-xs font-mono">{progress.done} / {progress.total}</span>
        )}
        {result && (
          <span className={`text-xs ${result.failed ? 'text-red-400' : 'text-chesto-gold'}`}>
            {result.failed
              ? `Done — ${result.failed} of ${result.total} sizes couldn't be prepared.`
              : `Done — ${result.total} image sizes ready.`}
          </span>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { docs: photos }  = useCollection('photos', 'createdAt', 'desc')
  const { docs: recipes } = useCollection('recipes', 'createdAt', 'desc')
  const { docs: posts }   = useCollection('posts', 'createdAt', 'desc')
  const { docs: reviews } = useCollection('reviews', 'createdAt', 'desc')

  const stats = [
    { label: 'Photos',  count: photos.length,  to: '/admin/photos',  action: 'Upload Photos' },
    { label: 'Recipes', count: recipes.length, to: '/admin/recipes', action: 'Add Recipe' },
    { label: 'Posts',   count: posts.length,   to: '/admin/blog',   action: 'Write Post' },
    { label: 'Reviews', count: reviews.length, to: '/admin/reviews', action: 'Add Review' },
  ]

  return (
    <div>
      <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-2">Dashboard</h1>
      <p className="text-chesto-cream/40 text-sm font-body mb-10">Welcome back. Here's what's on the site.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="bg-chesto-charcoal/40 border border-chesto-cream/10 p-6 hover:border-chesto-gold/40 transition-colors duration-200 group">
            <p className="text-chesto-cream/40 text-xs tracking-widest uppercase mb-2">{s.label}</p>
            <p className="font-display font-semibold text-4xl text-chesto-cream mb-4">{s.count}</p>
            <p className="text-xs text-chesto-gold/60 group-hover:text-chesto-gold transition-colors">
              {s.action}
              <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 text-[0.7rem] transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Quick actions</h2>
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/photos" className="btn-gold text-xs">Upload Photos</Link>
        <Link to="/admin/recipes/new" className="btn-ghost text-xs border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark">New Recipe</Link>
        <Link to="/admin/blog/new" className="btn-ghost text-xs border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark">New Blog Post</Link>
        <Link to="/admin/reviews/new" className="btn-ghost text-xs border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark">New Review</Link>
      </div>

      <PrepareImages photos={photos} recipes={recipes} posts={posts} />

      {/* Recent */}
      {recipes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Recent recipes</h2>
          <div className="space-y-2">
            {recipes.slice(0, 5).map(r => (
              <Link key={r.id} to={`/admin/recipes/${r.id}/edit`} className="flex items-center justify-between px-4 py-3 bg-chesto-charcoal/20 hover:bg-chesto-charcoal/40 transition-colors group">
                <span className="text-chesto-cream text-sm font-body">{r.title}</span>
                <span className="text-xs text-chesto-cream/30 group-hover:text-chesto-gold transition-colors">
                  Edit
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 text-[0.7rem] transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Recent reviews</h2>
          <div className="space-y-2">
            {reviews.slice(0, 5).map(r => (
              <Link key={r.id} to={`/admin/reviews/${r.id}/edit`} className="flex items-center justify-between px-4 py-3 bg-chesto-charcoal/20 hover:bg-chesto-charcoal/40 transition-colors group">
                <span className="text-chesto-cream text-sm font-body">{r.title}</span>
                <span className="text-xs text-chesto-cream/30 group-hover:text-chesto-gold transition-colors">
                  Edit
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 text-[0.7rem] transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
