import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { usePhotographySettings } from '../hooks/usePhotographySettings'
import PhotoGallery from './PhotoGallery'

const POST_BREAKPOINTS = { default: 3, 640: 2 }

// Resolves a category (and optional album) to its title, link and photos.
export function usePhotoSet(category, album) {
  const { categories, albums, loading: settingsLoading } = usePhotographySettings()
  const { docs: allPhotos, loading: photosLoading } = useCollection('photos', 'createdAt', 'desc')
  const cat = categories.find(c => c.slug === category)
  const alb = album ? albums.find(a => a.category === category && a.id === album) : null
  const photos = allPhotos.filter(p => p.category === category && (!album || p.album === album))
  return {
    loading: settingsLoading || photosLoading,
    found: Boolean(cat && (!album || alb)),
    title: alb ? alb.title : cat?.label ?? category,
    subtitle: alb ? cat?.label : null,
    to: `/photography/${category}${album ? `/${album}` : ''}`,
    photos,
  }
}

// An album or category shown inside a blog post
export default function PhotoGalleryEmbed({ category, album }) {
  const set = usePhotoSet(category, album)

  if (set.loading) return <div className="h-48 bg-chesto-charcoal/10 animate-pulse" />
  if (!set.found || set.photos.length === 0) return null

  return (
    <figure className="photo-gallery-embed">
      <figcaption className="flex items-end justify-between gap-4 mb-4">
        <div className="min-w-0">
          {set.subtitle && <div className="section-label mb-1">{set.subtitle}</div>}
          <div className="font-display font-semibold text-2xl text-chesto-dark leading-tight">{set.title}</div>
        </div>
        <Link to={set.to} className="flex-shrink-0 text-xs tracking-widest uppercase text-chesto-charcoal/50 hover:text-chesto-gold transition-colors photo-gallery-link">
          {set.photos.length} photo{set.photos.length !== 1 ? 's' : ''} →
        </Link>
      </figcaption>
      <PhotoGallery photos={set.photos} label={set.title} breakpoints={POST_BREAKPOINTS} pageSize={9} />
    </figure>
  )
}
