import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'
import DOMPurify from 'dompurify'
import { SocialEmbedNode } from './SocialEmbedExtension'
import { parseEmbed } from '../lib/embeds'

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
        active
          ? 'bg-chesto-gold text-chesto-dark'
          : 'text-chesto-cream/60 hover:text-chesto-cream hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, allowEmbeds = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      ...(allowEmbeds ? [SocialEmbedNode] : []),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(DOMPurify.sanitize(editor.getHTML())),
    editorProps: {
      attributes: {
        class: 'min-h-[320px] px-4 py-3 font-body text-sm text-chesto-cream leading-relaxed focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value])

  const setLink = () => {
    const url = window.prompt('URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
    else editor.chain().focus().unsetLink().run()
  }

  const addEmbed = () => {
    const input = window.prompt('Paste a link or embed code from YouTube, TikTok, Instagram, or X/Twitter')
    if (!input) return
    const embed = parseEmbed(input)
    if (!embed) return alert('That link isn’t supported. Use a YouTube, TikTok, Instagram, or X/Twitter post link.')
    if (embed.error) return alert(embed.error)
    editor.chain().focus().insertSocialEmbed(embed.url).run()
  }

  if (!editor) return null

  return (
    <div className="border border-chesto-cream/10 bg-chesto-charcoal">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-chesto-cream/10">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">B</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>

        <span className="w-px h-5 bg-chesto-cream/10 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarButton>

        <span className="w-px h-5 bg-chesto-cream/10 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">• List</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">1. List</ToolbarButton>

        <span className="w-px h-5 bg-chesto-cream/10 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">" Quote</ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">Link</ToolbarButton>
        {allowEmbeds && (
          <ToolbarButton onClick={addEmbed} active={false} title="Embed a post or video from YouTube, TikTok, Instagram, or X">Embed</ToolbarButton>
        )}
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
