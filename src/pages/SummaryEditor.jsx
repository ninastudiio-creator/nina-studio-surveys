import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

const SAVE_DELAY = 800

function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="editor-toolbar-btn"
      data-active={active || undefined}
    >
      {children}
    </button>
  )
}

export default function SummaryEditor() {
  const { clientId } = useParams()

  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: { class: 'prose', dir: 'rtl' },
    },
    onUpdate: ({ editor }) => {
      persist(editor.getHTML())
    },
  })

  function persist(html) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('clients').update({ discovery_summary: html }).eq('id', clientId)
      setSaveState(error ? 'idle' : 'saved')
    }, SAVE_DELAY)
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('clients').select('name, discovery_summary').eq('id', clientId).single()
      setClientName(data?.name || '')
      if (data?.discovery_summary && editor) {
        editor.commands.setContent(data.discovery_summary)
      }
      setLoading(false)
    }
    if (editor) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, editor])

  return (
    <AdminLayout>
      <Link to={`/clients/${clientId}`} style={{ fontSize: '0.9rem' }}>
        ← חזרה ל{clientName || 'לקוח'}
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5em' }}>
        <h1 style={{ margin: 0 }}>סיכום שיחת אפיון</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {saveState === 'saving' ? 'שומר...' : saveState === 'saved' ? '✓ נשמר' : ''}
        </span>
      </div>

      {loading && <p style={{ marginTop: '1em' }}>טוען...</p>}

      {editor && (
        <div className="card editor-card" style={{ marginTop: '1em' }}>
          <div className="editor-toolbar">
            <ToolbarButton title="בולד" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton title="נטוי" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <em>i</em>
            </ToolbarButton>
            <span className="editor-toolbar-sep" />
            <ToolbarButton title="כותרת גדולה" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              H2
            </ToolbarButton>
            <ToolbarButton title="כותרת קטנה" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              H3
            </ToolbarButton>
            <ToolbarButton title="טקסט רגיל" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
              רגיל
            </ToolbarButton>
            <span className="editor-toolbar-sep" />
            <ToolbarButton title="רשימת בולטים" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              • רשימה
            </ToolbarButton>
            <ToolbarButton title="רשימה ממוספרת" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              1. רשימה
            </ToolbarButton>
          </div>
          <EditorContent editor={editor} />
        </div>
      )}
    </AdminLayout>
  )
}
