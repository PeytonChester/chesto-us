import { Link } from 'react-router-dom'
import { useCollection } from '../../hooks/useCollection'

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
            <p className="text-xs text-chesto-gold/60 group-hover:text-chesto-gold transition-colors">{s.action} →</p>
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

      {/* Recent */}
      {recipes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-chesto-cream/50 text-xs tracking-widest uppercase mb-4">Recent recipes</h2>
          <div className="space-y-2">
            {recipes.slice(0, 5).map(r => (
              <Link key={r.id} to={`/admin/recipes/${r.id}/edit`} className="flex items-center justify-between px-4 py-3 bg-chesto-charcoal/20 hover:bg-chesto-charcoal/40 transition-colors group">
                <span className="text-chesto-cream text-sm font-body">{r.title}</span>
                <span className="text-xs text-chesto-cream/30 group-hover:text-chesto-gold transition-colors">Edit →</span>
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
                <span className="text-xs text-chesto-cream/30 group-hover:text-chesto-gold transition-colors">Edit →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
