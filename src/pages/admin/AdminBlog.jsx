import { Link } from 'react-router-dom'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCollection } from '../../hooks/useCollection'
import { useBlogSettings } from '../../hooks/useBlogSettings'

export default function AdminBlog() {
  const { docs: posts, loading } = useCollection('posts', 'publishedAt', 'desc')
  useBlogSettings() // preload settings so editor dropdown is always fresh

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return
    await deleteDoc(doc(db, 'posts', post.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-3xl text-chesto-cream mb-1">Blog</h1>
          <p className="text-chesto-cream/40 text-sm">{posts.length} posts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/blog-categories" className="btn-ghost border-chesto-cream/20 text-chesto-cream hover:bg-chesto-cream hover:text-chesto-dark text-sm">Edit Categories</Link>
          <Link to="/admin/blog/new" className="btn-gold">+ New Post</Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-chesto-charcoal/20 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-4 border border-chesto-cream/10">
          <p className="text-chesto-cream/20 text-sm tracking-wider">No posts yet</p>
          <Link to="/admin/blog/new" className="btn-gold text-xs">Write your first post</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 bg-chesto-charcoal/20 px-4 py-3 group hover:bg-chesto-charcoal/30 transition-colors">
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.title} className="w-12 h-12 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-chesto-cream font-body font-medium truncate">{post.title}</p>
                  {post.published === false && (
                    <span className="flex-shrink-0 text-xs font-mono px-1.5 py-0.5 border border-chesto-cream/20 text-chesto-cream/40">Draft</span>
                  )}
                </div>
                <p className="text-chesto-cream/40 text-xs">
                  {post.category} · {(post.publishedAt ?? post.createdAt)?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Link to={`/admin/blog/${post.id}/edit`} className="text-xs text-chesto-gold hover:text-chesto-gold-light px-3 py-1.5 border border-chesto-gold/30 hover:border-chesto-gold transition-colors">
                  Edit
                </Link>
                <button onClick={() => handleDelete(post)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 hover:border-red-400 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
