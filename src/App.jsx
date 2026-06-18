import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Public pages
import Layout from './components/Layout'
import Home from './pages/Home'
import Photography from './pages/Photography'
import PhotoCategory from './pages/PhotoCategory'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import NotFound from './pages/NotFound'

// Admin
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHome from './pages/admin/AdminHome'
import AdminPhotos from './pages/admin/AdminPhotos'
import AdminRecipes from './pages/admin/AdminRecipes'
import AdminRecipeEditor from './pages/admin/AdminRecipeEditor'
import AdminBlog from './pages/admin/AdminBlog'
import AdminBlogEditor from './pages/admin/AdminBlogEditor'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="text-chesto-charcoal/40 text-sm tracking-widest uppercase">Loading…</span></div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="photography" element={<Photography />} />
          <Route path="photography/:category" element={<PhotoCategory />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:slug" element={<RecipeDetail />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="home" element={<AdminHome />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="recipes" element={<AdminRecipes />} />
          <Route path="recipes/new" element={<AdminRecipeEditor />} />
          <Route path="recipes/:id/edit" element={<AdminRecipeEditor />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="blog/new" element={<AdminBlogEditor />} />
          <Route path="blog/:id/edit" element={<AdminBlogEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
