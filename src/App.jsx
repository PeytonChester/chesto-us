import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PageLoading from './components/PageLoading'
import Home from './pages/Home' // landing page: part of the main bundle, not lazy

// Every page is its own chunk, so visitors only download the page they open
// and never the admin panel, editor, or Firebase Auth/Storage code.

// Public pages
const Photography = lazy(() => import('./pages/Photography'))
const PhotoCategory = lazy(() => import('./pages/PhotoCategory'))
const Recipes = lazy(() => import('./pages/Recipes'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Reviews = lazy(() => import('./pages/Reviews'))
const ReviewDetail = lazy(() => import('./pages/ReviewDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Admin
const AdminRoot = lazy(() => import('./pages/admin/AdminRoot'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminHome = lazy(() => import('./pages/admin/AdminHome'))
const AdminPhotos = lazy(() => import('./pages/admin/AdminPhotos'))
const AdminRecipes = lazy(() => import('./pages/admin/AdminRecipes'))
const AdminRecipeEditor = lazy(() => import('./pages/admin/AdminRecipeEditor'))
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'))
const AdminBlogEditor = lazy(() => import('./pages/admin/AdminBlogEditor'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminAlbums = lazy(() => import('./pages/admin/AdminAlbums'))
const AdminBlogCategories = lazy(() => import('./pages/admin/AdminBlogCategories'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminReviewEditor = lazy(() => import('./pages/admin/AdminReviewEditor'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading fullScreen />}>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="photography" element={<Photography />} />
          <Route path="photography/:category" element={<PhotoCategory />} />
          <Route path="photography/:category/:album" element={<PhotoCategory />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:slug" element={<RecipeDetail />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="reviews/:slug" element={<ReviewDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminRoot />}>
          <Route index element={<AdminDashboard />} />
          <Route path="home" element={<AdminHome />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="photo-categories" element={<AdminCategories />} />
          <Route path="photo-albums" element={<AdminAlbums />} />
          <Route path="recipes" element={<AdminRecipes />} />
          <Route path="recipes/new" element={<AdminRecipeEditor />} />
          <Route path="recipes/:id/edit" element={<AdminRecipeEditor />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="blog/new" element={<AdminBlogEditor />} />
          <Route path="blog/:id/edit" element={<AdminBlogEditor />} />
          <Route path="blog-categories" element={<AdminBlogCategories />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="reviews/new" element={<AdminReviewEditor />} />
          <Route path="reviews/:id/edit" element={<AdminReviewEditor />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
