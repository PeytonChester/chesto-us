import { Outlet, NavLink, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-400 ${
        scrolled ? 'bg-chesto-cream/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className={`font-display font-semibold text-xl tracking-tight transition-colors duration-400 ${scrolled ? 'text-chesto-dark' : 'text-chesto-cream'}`}>
            Chesto<span className="text-chesto-gold">.</span>us
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
            {[
              { to: '/', label: 'Home' },
              { to: '/photography', label: 'Photography' },
              { to: '/recipes', label: 'Recipes' },
              { to: '/blog', label: 'Blog' },
            ].map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-link transition-colors duration-400 ${
                    scrolled
                      ? `text-chesto-charcoal/70 hover:text-chesto-dark ${isActive ? 'active text-chesto-dark' : ''}`
                      : `text-chesto-cream/90 hover:text-white ${isActive ? 'active text-white' : ''}`
                  }`}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-px transition-all duration-300 ${scrolled ? 'bg-chesto-dark' : 'bg-white'} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-px transition-all duration-300 ${scrolled ? 'bg-chesto-dark' : 'bg-white'} ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-px transition-all duration-300 ${scrolled ? 'bg-chesto-dark' : 'bg-white'} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-chesto-cream border-t border-chesto-charcoal/10 px-6 py-6 flex flex-col gap-5">
            {[
              { to: '/', label: 'Home' },
              { to: '/photography', label: 'Photography' },
              { to: '/recipes', label: 'Recipes' },
              { to: '/blog', label: 'Blog' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-link text-base ${isActive ? 'active text-chesto-dark' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 page-enter">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-chesto-charcoal/10 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg text-chesto-dark">
            Chesto<span className="text-chesto-gold">.</span>us
          </span>
          <p className="text-xs text-chesto-charcoal/40 tracking-wider">
            © {new Date().getFullYear()} Chesto.us · Photography &amp; Food
          </p>
          <Link to="/admin" className="text-xs text-chesto-charcoal/30 hover:text-chesto-charcoal/60 transition-colors tracking-widest uppercase">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  )
}
