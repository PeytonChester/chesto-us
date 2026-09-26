import { useParams, Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { usePhotographySettings } from '../hooks/usePhotographySettings'
import PageMeta from '../components/PageMeta'
import PhotoGallery from '../components/PhotoGallery'
import NotFound from './NotFound'
import { responsiveImage } from '../lib/images'

function AlbumCard({ album, to, cover, count }) {
  return (
    <Link to={to} className="photo-card group" style={{ aspectRatio: '3/2' }}>
      {cover ? (
        <img {...responsiveImage(cover, '(max-width: 768px) 100vw, 50vw')} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full bg-stone-700" />
      )}
      <div className="absolute inset-0 bg-chesto-dark/60 hover:bg-chesto-dark/40 transition-all duration-400 flex flex-col justify-end p-6 md:p-8">
        <p className="font-display font-semibold text-2xl md:text-3xl text-chesto-cream leading-tight">{album.title}</p>
        <span className="mt-4 text-xs text-chesto-cream/50 tracking-widest uppercase group-hover:text-chesto-gold transition-colors duration-200">
          {count} photo{count !== 1 ? 's' : ''} →
        </span>
      </div>
    </Link>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-photo bg-chesto-charcoal/10 animate-pulse" />
      ))}
    </div>
  )
}

export default function PhotoCategory() {
  const { category, album: albumId } = useParams()
  const { docs: allPhotos, loading: photosLoading } = useCollection('photos', 'createdAt', 'desc')
  const { categories, albums: allAlbums, loading: settingsLoading } = usePhotographySettings()
  const loading = photosLoading || settingsLoading

  const cat = categories.find(c => c.slug === category)
  const label = cat?.label ?? category.charAt(0).toUpperCase() + category.slice(1)
  const categoryPhotos = allPhotos.filter(p => p.category === category)
  const albums = allAlbums.filter(a => a.category === category)
  const albumIds = new Set(albums.map(a => a.id))

  const album = albumId ? albums.find(a => a.id === albumId) : null
  if (albumId && !settingsLoading && !album) return <NotFound />

  // Album page, or a category page: album covers first, then any photos not in an album
  const photos = album
    ? categoryPhotos.filter(p => p.album === album.id)
    : categoryPhotos.filter(p => !albumIds.has(p.album))
  const showAlbums = !album && albums.length > 0

  const title = album ? album.title : label
  const backTo = album ? `/photography/${category}` : '/photography'
  const backLabel = album ? label : 'Photography'

  return (
    <div className="pt-16">
      <PageMeta
        title={album ? `${album.title} · ${label} Photography` : `${label} Photography`}
        description={album ? `${album.title} — ${label.toLowerCase()} photography on Chesto.us.` : `Browse ${label.toLowerCase()} photography on Chesto.us.`}
        image={album?.cover}
      />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <Link to={backTo} className="section-label text-chesto-charcoal/50 hover:text-chesto-gold transition-colors mb-4 inline-block">
          ← {backLabel}
        </Link>
        <h1 className="display-heading text-5xl md:text-6xl">{title}</h1>
        {!loading && (
          <p className="text-chesto-charcoal/50 mt-2 font-body">
            {showAlbums
              ? `${albums.length} album${albums.length !== 1 ? 's' : ''}`
              : `${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        {loading ? (
          <GridSkeleton />
        ) : (
          <>
            {showAlbums && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {albums.map(a => {
                  const albumPhotos = categoryPhotos.filter(p => p.album === a.id)
                  return (
                    <AlbumCard
                      key={a.id}
                      album={a}
                      to={`/photography/${category}/${a.id}`}
                      cover={a.cover || albumPhotos[0]?.url}
                      count={albumPhotos.length}
                    />
                  )
                })}
              </div>
            )}

            {photos.length > 0 ? (
              <div className={showAlbums ? 'mt-16' : ''}>
                {showAlbums && <p className="section-label mb-6">More photos</p>}
                <PhotoGallery key={album?.id ?? category} photos={photos} label={title} />
              </div>
            ) : !showAlbums && (
              <div className="h-64 flex flex-col items-center justify-center gap-4 border border-chesto-charcoal/10">
                <p className="text-chesto-charcoal/30 text-sm tracking-wider">No photos {album ? 'in this album' : 'in this category'} yet</p>
                <Link to="/admin/photos" className="btn-ghost text-xs">Add Photos</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
