import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AdminLayout from './AdminLayout'

// Signed-in gate for the admin panel; loaded only when /admin is opened
export default function AdminRoot() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="text-chesto-charcoal/40 text-sm tracking-widest uppercase">Loading…</span></div>
  if (!user) return <Navigate to="/admin/login" replace />
  return <AdminLayout />
}
