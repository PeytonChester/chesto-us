import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import PageMeta from '../components/PageMeta'
import { responsiveImage } from '../lib/images'

function formatDate(ts) {
  return ts?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Blog() {
  const { docs: allPosts, loading } = useCollection('posts', 'publishedAt', 'desc')
  const posts = allPosts.filter(p => p.published !== false)

  return (
    <div className="pt-16">
      <PageMeta title="Blog" description="Writing on photography, food, and life." />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="section-label mb-3">Writing</p>
        <h1 className="display-heading text-5xl md:text-7xl mb-16">Blog</h1>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-chesto-charcoal/10">
                <div className="aspect-photo bg-chesto-charcoal/10" />
                <div className="p-6">
                  <div className="h-3 bg-chesto-charcoal/10 w-20 mb-3" />
                  <div className="h-6 bg-chesto-charcoal/10 w-3/4 mb-3" />
                  <div className="h-3 bg-chesto-charcoal/10 w-full mb-2" />
                  <div className="h-3 bg-chesto-charcoal/10 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-chesto-charcoal/10 text-chesto-charcoal/30 text-sm tracking-wider">
            No posts yet — check back soon
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group content-card">
                <div className="content-card-media">
                  {post.imageUrl ? (
                    <img {...responsiveImage(post.imageUrl, '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw')} loading="lazy" alt={post.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-chesto-dark">
                      <span className="font-display italic text-3xl text-chesto-gold/60">{post.category || 'Blog'}</span>
                    </div>
                  )}
                </div>
                <div className="content-card-body">
                  <p className="section-label mb-2">{post.category || 'Blog'}</p>
                  <h2 className="font-display font-semibold text-2xl text-chesto-dark group-hover:text-chesto-gold transition-colors duration-200 mb-2 leading-snug">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-chesto-charcoal/60 font-body text-sm leading-relaxed line-clamp-3 mb-5">{post.excerpt}</p>
                  )}
                  <div className="content-card-meta">
                    <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
