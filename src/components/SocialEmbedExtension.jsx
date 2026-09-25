import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { Plugin } from '@tiptap/pm/state'
import SocialEmbed from './SocialEmbed'
import { parseEmbed, PROVIDER_LABELS } from '../lib/embeds'

function EmbedNodeView({ node, selected, deleteNode }) {
  const embed = parseEmbed(node.attrs.url)
  return (
    <NodeViewWrapper className={`my-4 border ${selected ? 'border-chesto-gold' : 'border-chesto-cream/10'}`}>
      <div data-drag-handle className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 cursor-grab">
        <span className="text-xs text-chesto-cream/60 truncate">
          <span className="text-chesto-gold font-medium mr-2">{PROVIDER_LABELS[embed?.provider] ?? 'Embed'}</span>
          {node.attrs.url}
        </span>
        <button type="button" onClick={deleteNode} className="text-xs text-chesto-cream/40 hover:text-red-400 shrink-0">
          Remove
        </button>
      </div>
      <div className="p-3" contentEditable={false}>
        <SocialEmbed url={node.attrs.url} />
      </div>
    </NodeViewWrapper>
  )
}

export const SocialEmbedNode = Node.create({
  name: 'socialEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: el => el.getAttribute('data-embed-url'),
        renderHTML: attrs => ({ 'data-embed-url': attrs.url }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-embed-url]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'social-embed-slot' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView)
  },

  addCommands() {
    return {
      insertSocialEmbed: url => ({ commands }) => {
        const embed = parseEmbed(url)
        if (!embed || embed.error) return false
        return commands.insertContent({ type: this.name, attrs: { url: embed.url } })
      },
    }
  },

  // Pasting a supported link on an empty line turns it into an embed;
  // pasting one inside existing text keeps it as a normal link.
  addProseMirrorPlugins() {
    const type = this.type
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain')?.trim()
            if (!text || /\s/.test(text)) return false
            const { $from, empty } = view.state.selection
            if (!empty || $from.parent.type.name !== 'paragraph' || $from.parent.content.size > 0) return false
            const embed = parseEmbed(text)
            if (!embed || embed.error) return false
            view.dispatch(view.state.tr.replaceSelectionWith(type.create({ url: embed.url })).scrollIntoView())
            return true
          },
        },
      }),
    ]
  },
})
