import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/admin/home', label: 'Home Page', icon: '◈' },
  { to: '/admin/photos', label: 'Photos', icon: '◻' },
  { to: '/admin/recipes', label: 'Recipes', icon: '◇' },
  { to: '/admin/blog', label: 'Blog', icon: '○' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-chesto-dark">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-chesto-cream/10 flex flex-col py-8 px-4">
        <Link to="/" className="font-display font-semibold text-lg text-chesto-cream mb-10 px-4">
          Chesto<span className="text-chesto-gold">.</span>us
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="admin-nav-item w-full text-left mt-4 border-t border-chesto-cream/10 pt-4"
        >
          <span>↩</span> Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
