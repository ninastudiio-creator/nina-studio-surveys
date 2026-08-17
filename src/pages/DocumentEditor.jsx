import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
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

export default function DocumentEditor() {
  const { clientId, documentId } = useParams()
  const navigate = useNavigate()

  const [clientName, setClientName] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const saveTimer = useRef(null)
  const titleSaveTimer = useRef(null)

  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: '',
    editorProps: {
      attributes: { class: 'prose', dir: 'rtl' },
    },
    onUpdate: ({ editor }) => {
      persistContent(editor.getHTML())
    },
  })

  function persistContent(html) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('documents').update({ content: html, updated_at: new Date().toISOString() }).eq('id', documentId)
      setSaveState(error ? 'idle' : 'saved')
    }, SAVE_DELAY)
  }

  function handleTitleChange(value) {
    setTitle(value)
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current)
    setSaveState('saving')
    titleSaveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('documents').update({ title: value, updated_at: new Date().toISOString() }).eq('id', documentId)
      setSaveState(error ? 'idle' : 'saved')
    }, SAVE_DELAY)
  }

  async function handleDelete() {
    if (!confirm('למחוק את המסמך הזה? הפעולה לא הפיכה.')) return
    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) {
      alert('מחיקה נכשלה')
      return
    }
    navigate(`/clients/${clientId}`)
  }

  useEffect(() => {
    async function load() {
      const [{ data: clientData }, { data: docData }] = await Promise.all([
        supabase.from('clients').select('name').eq('id', clientId).single(),
        supabase.from('documents').select('title, content').eq('id', documentId).single(),
      ])
      setClientName(clientData?.name || '')
      if (docData) {
        setTitle(docData.title || '')
        if (docData.content && editor) editor.commands.setContent(docData.content)
      }
      setLoading(false)
    }
    if (editor) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, documentId, editor])

  return (
    <AdminLayout>
      <Link to={`/clients/${clientId}`} style={{ fontSize: '0.9rem' }}>
        ← חזרה ל{clientName || 'לקוח'}
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.8em', gap: '0.8em', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="שם המסמך"
          className="document-title-input"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8em' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {saveState === 'saving' ? 'שומר...' : saveState === 'saved' ? '✓ נשמר' : ''}
          </span>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            מחיקת מסמך
          </button>
        </div>
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
            <ToolbarButton title="מרקר" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
              <span className="marker-icon">מרקר</span>
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
