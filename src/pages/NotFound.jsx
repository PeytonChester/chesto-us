import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'

const LINKS = [
  { to: '/photography', label: 'Photography' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/blog', label: 'Blog' },
]

export default function NotFound() {
  return (
    <div className="pt-16 min-h-screen flex items-center">
      <PageMeta title="Page Not Found" description="The page you're looking for doesn't exist or may have moved." />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 w-full">
        <p className="font-mono text-chesto-gold text-xs tracking-[0.3em] uppercase mb-6">404</p>
        <h1 className="font-display font-semibold text-5xl md:text-7xl text-chesto-dark leading-tight mb-6">
          Nothing here.
        </h1>
        <p className="text-chesto-charcoal/50 font-body text-lg max-w-md leading-relaxed mb-12">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/" className="btn-gold">Go Home</Link>
          {LINKS.map(link => (
            <Link key={link.to} to={link.to} className="btn-ghost">{link.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
