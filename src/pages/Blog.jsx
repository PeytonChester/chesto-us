import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import PageMeta from '../components/PageMeta'

export default function Blog() {
  const { docs: posts, loading } = useCollection('posts', 'publishedAt', 'desc')

  return (
    <div className="pt-16">
      <PageMeta title="Blog" description="Writing on photography, food, and life." />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="section-label mb-3">Writing</p>
        <h1 className="display-heading text-5xl md:text-7xl mb-16">Blog</h1>

        {loading ? (
          <div className="space-y-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-8">
                <div className="w-48 h-32 bg-chesto-charcoal/10 flex-shrink-0 hidden md:block" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-chesto-charcoal/10 w-20" />
                  <div className="h-6 bg-chesto-charcoal/10 w-2/3" />
                  <div className="h-3 bg-chesto-charcoal/10 w-full" />
                  <div className="h-3 bg-chesto-charcoal/10 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            No posts yet — write something in the admin panel
          </div>
        ) : (
          <div className="divide-y divide-chesto-charcoal/10">
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group flex flex-col md:flex-row gap-6 md:gap-10 py-10">
                {post.imageUrl && (
                  <div className="w-full md:w-52 h-36 overflow-hidden flex-shrink-0">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <p className="section-label mb-2">{post.category || 'Blog'}</p>
                  <h2 className="font-display font-semibold text-2xl md:text-3xl text-chesto-dark group-hover:text-chesto-gold transition-colors duration-200 mb-3 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-chesto-charcoal/60 font-body text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                  <span className="text-xs font-mono text-chesto-charcoal/40">
                    {(post.publishedAt ?? post.createdAt)?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
