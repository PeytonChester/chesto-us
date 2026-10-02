import { useState, Suspense } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebaseAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGauge, faHouse, faImages, faUtensils, faPenNib, faFilm,
  faRightFromBracket, faBars, faXmark,
} from '@fortawesome/free-solid-svg-icons'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: faGauge, end: true },
  { to: '/admin/home', label: 'Home Page', icon: faHouse },
  { to: '/admin/photos', label: 'Photos', icon: faImages },
  { to: '/admin/recipes', label: 'Recipes', icon: faUtensils },
  { to: '/admin/blog', label: 'Blog', icon: faPenNib },
  { to: '/admin/reviews', label: 'Reviews', icon: faFilm },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  const navContent = (
    <>
      <nav className="flex-1 space-y-1">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={item.icon} fixedWidth className="text-sm" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleSignOut}
        className="admin-nav-item w-full text-left mt-4 border-t border-chesto-cream/10 pt-4"
      >
        <FontAwesomeIcon icon={faRightFromBracket} fixedWidth className="text-sm" /> Sign out
      </button>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-chesto-dark">

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-5 h-14 border-b border-chesto-cream/10 flex-shrink-0">
        <Link to="/" className="font-display font-semibold text-lg text-chesto-cream">
          Chesto<span className="text-chesto-gold">.</span>us
        </Link>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="p-2 text-chesto-cream/70 hover:text-chesto-cream transition-colors"
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} fixedWidth className="text-lg" />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-chesto-dark/70 backdrop-blur-sm" />
          <aside className="relative w-64 h-full bg-chesto-dark border-r border-chesto-cream/10 flex flex-col py-8 px-4" onClick={e => e.stopPropagation()}>
            <Link to="/" onClick={() => setMenuOpen(false)} className="font-display font-semibold text-lg text-chesto-cream mb-10 px-4">
              Chesto<span className="text-chesto-gold">.</span>us
            </Link>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-chesto-cream/10 flex-col py-8 px-4">
        <Link to="/" className="font-display font-semibold text-lg text-chesto-cream mb-10 px-4">
          Chesto<span className="text-chesto-gold">.</span>us
        </Link>
        {navContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <Suspense fallback={<div className="text-chesto-cream/40 text-sm animate-pulse">Loading…</div>}><Outlet /></Suspense>
        </div>
      </main>
    </div>
  )
}
