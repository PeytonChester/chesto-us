import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Helmet } from 'react-helmet-async'
import { db } from '../firebase'
import PageMeta from '../components/PageMeta'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) setPost({ id: snap.docs[0].id, ...snap.docs[0].data() })
      setLoading(false)
    }
    fetch()
  }, [slug])

  if (loading) return (
    <div className="pt-16 max-w-2xl mx-auto px-6 md:px-10 py-24 animate-pulse space-y-6">
      <div className="h-4 bg-chesto-charcoal/10 w-24" />
      <div className="h-10 bg-chesto-charcoal/10 w-3/4" />
      <div className="h-64 bg-chesto-charcoal/10 w-full" />
    </div>
  )

  if (!post) return (
    <div className="pt-16 max-w-2xl mx-auto px-6 md:px-10 py-24 text-center">
      <p className="text-chesto-charcoal/40 text-sm tracking-widest uppercase">Post not found</p>
      <Link to="/blog" className="btn-ghost mt-6 inline-flex">← Back to Blog</Link>
    </div>
  )

  const publishedDate = (post.publishedAt ?? post.createdAt)?.toDate?.()
  const modifiedDate = post.updatedAt?.toDate?.()

  return (
    <article className="pt-16">
      <PageMeta title={post.title} description={post.excerpt} image={post.imageUrl} />
      <Helmet>
        <meta property="og:type" content="article" />
        {publishedDate && <meta property="article:published_time" content={publishedDate.toISOString()} />}
        {modifiedDate && <meta property="article:modified_time" content={modifiedDate.toISOString()} />}
      </Helmet>
      {post.imageUrl && (
        <div className="w-full h-[45vh] md:h-[60vh] overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-14">
        <Link to="/blog" className="section-label text-chesto-charcoal/50 hover:text-chesto-gold transition-colors mb-6 inline-block">
          ← Blog
        </Link>

        <p className="section-label mb-3">{post.category}</p>
        <h1 className="display-heading text-4xl md:text-5xl mb-4 leading-tight">{post.title}</h1>

        <p className="text-xs font-mono text-chesto-charcoal/40 mb-10">
          {publishedDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div
          className="prose-chesto"
          dangerouslySetInnerHTML={{
            __html: Array.isArray(post.body)
              ? post.body.map(p => `<p>${p}</p>`).join('')
              : post.body || ''
          }}
        />
      </div>
    </article>
  )
}
