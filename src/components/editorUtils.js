import { NodeSelection } from '@tiptap/pm/state'

// Insert a block at the cursor. When a block (e.g. an embed) is selected,
// insert after it instead of replacing it.
export function insertBlock(editor, content) {
  const { selection } = editor.state
  if (selection instanceof NodeSelection) {
    return editor.chain().focus().insertContentAt(selection.to, content).run()
  }
  return editor.chain().focus().insertContent(content).run()
}
