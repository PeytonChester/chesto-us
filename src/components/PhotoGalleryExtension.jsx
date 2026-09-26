import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { usePhotographySettings } from '../hooks/usePhotographySettings'
import { usePhotoSet } from './PhotoGalleryEmbed'
import { insertBlock } from './editorUtils'
import { fixedImage } from '../lib/images'

function GalleryNodeView({ node, selected, deleteNode }) {
  const { category, album } = node.attrs
  const set = usePhotoSet(category, album)
  const missing = !set.loading && !set.found

  return (
    <NodeViewWrapper className={`my-4 border ${selected ? 'border-chesto-gold' : 'border-chesto-cream/10'}`}>
      <div data-drag-handle className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 cursor-grab">
        <span className="text-xs text-chesto-cream/60 truncate">
          <span className="text-chesto-gold font-medium mr-2">{album ? 'Album' : 'Category'}</span>
          {set.subtitle && <span className="text-chesto-cream/40">{set.subtitle} › </span>}
          {set.title}
          {!set.loading && !missing && <span className="text-chesto-cream/40"> · {set.photos.length} photo{set.photos.length !== 1 ? 's' : ''}</span>}
        </span>
        <button type="button" onClick={deleteNode} className="text-xs text-chesto-cream/40 hover:text-red-400 shrink-0">
          Remove
        </button>
      </div>
      <div className="p-3" contentEditable={false}>
        {missing ? (
          <p className="text-xs text-red-400">This {album ? 'album' : 'category'} no longer exists, so nothing will show in the post.</p>
        ) : set.photos.length === 0 ? (
          <p className="text-xs text-chesto-cream/40">{set.loading ? 'Loading…' : 'No photos here yet — nothing will show in the post until there are.'}</p>
        ) : (
          <div className="grid grid-cols-6 gap-1">
            {set.photos.slice(0, 6).map(p => (
              <img key={p.id} {...fixedImage(p.url, 128)} alt="" className="w-full aspect-square object-cover" />
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const PhotoGalleryNode = Node.create({
  name: 'photoGallery',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      category: {
        default: null,
        parseHTML: el => el.getAttribute('data-category'),
        renderHTML: attrs => ({ 'data-category': attrs.category }),
      },
      album: {
        default: null,
        parseHTML: el => el.getAttribute('data-album') || null,
        renderHTML: attrs => (attrs.album ? { 'data-album': attrs.album } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-photo-gallery]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-photo-gallery': '', class: 'photo-gallery-slot' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView)
  },
})

// Toolbar dropdown listing every category and album
export function PhotoGalleryPicker({ editor }) {
  const { categories, albums } = usePhotographySettings()

  const insert = (value) => {
    if (!value) return
    const [category, album] = value.split('/')
    insertBlock(editor, { type: 'photoGallery', attrs: { category, album: album || null } })
  }

  return (
    <select
      value=""
      onChange={e => insert(e.target.value)}
      title="Add an album or category of photos"
      className="bg-transparent text-chesto-cream/60 hover:text-chesto-cream text-xs font-medium px-1.5 py-1.5 rounded cursor-pointer focus:outline-none hover:bg-white/10"
    >
      <option value="" disabled>Photos</option>
      {categories.map(c => {
        const catAlbums = albums.filter(a => a.category === c.slug)
        return (
          <optgroup key={c.slug} label={c.label}>
            <option value={c.slug} className="text-chesto-dark">All {c.label} photos</option>
            {catAlbums.map(a => <option key={a.id} value={`${c.slug}/${a.id}`} className="text-chesto-dark">{a.title}</option>)}
          </optgroup>
        )
      })}
    </select>
  )
}
