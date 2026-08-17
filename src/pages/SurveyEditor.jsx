import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

function newQuestion() {
  return { id: crypto.randomUUID(), label: '', type: 'text', required: false }
}

function newSection() {
  return { id: crypto.randomUUID(), label: '', type: 'section' }
}

export default function SurveyEditor({ isEditing }) {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [questions, setQuestions] = useState([newQuestion()])
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) return
    async function load() {
      const { data, error } = await supabase
        .from('surveys')
        .select('title, intro, questions')
        .eq('client_id', clientId)
        .single()

      if (error || !data) {
        setError('השאלון לא נמצא')
        setLoading(false)
        return
      }
      setTitle(data.title)
      setIntro(data.intro || '')
      setQuestions(data.questions?.length ? data.questions : [newQuestion()])
      setLoading(false)
    }
    load()
  }, [clientId, isEditing])

  function updateQuestion(qid, patch) {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)))
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, newQuestion()])
  }

  function addSection() {
    setQuestions((prev) => [...prev, newSection()])
  }

  function removeQuestion(qid) {
    setQuestions((prev) => prev.filter((q) => q.id !== qid))
  }

  function moveQuestion(index, direction) {
    setQuestions((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanQuestions = questions
      .map((q) => ({ ...q, label: q.label.trim() }))
      .filter((q) => q.label.length > 0)

    if (!title.trim()) {
      setError('צריך לתת כותרת לשאלון')
      return
    }
    if (cleanQuestions.filter((q) => q.type !== 'section').length === 0) {
      setError('צריך לפחות שאלה אחת עם תוכן')
      return
    }

    const payload = { title: title.trim(), intro: intro.trim(), questions: cleanQuestions }

    setSaving(true)
    if (isEditing) {
      const { error } = await supabase.from('surveys').update(payload).eq('client_id', clientId)
      setSaving(false)
      if (error) {
        setError('שמירה נכשלה')
        return
      }
    } else {
      const { error } = await supabase.from('surveys').insert({ ...payload, client_id: clientId })
      setSaving(false)
      if (error) {
        setError('יצירה נכשלה')
        return
      }
    }
    navigate(`/clients/${clientId}`)
  }

  if (loading) {
    return (
      <AdminLayout>
        <p>טוען...</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1>{isEditing ? 'עריכת שאלון' : 'שאלון חדש'}</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">כותרת השאלון</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: שאלון אפיון לאתר תדמית"
          />
        </div>

        <div className="field">
          <label htmlFor="intro">
            פתיחה <span className="hint">(מוצג ללקוחה מעל השאלות, לא חובה)</span>
          </label>
          <textarea
            id="intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="היי! כיף להכיר... לפני שנדבר, אשמח שתמלאי כמה שאלות..."
          />
        </div>

        <h3 style={{ marginTop: '1.5em' }}>שאלות</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9em' }}>
          {questions.map((q, index) =>
            q.type === 'section' ? (
              <div key={q.id} className="card" style={{ padding: '1.1em', background: 'var(--color-blue-light)', boxShadow: 'none' }}>
                <div style={{ display: 'flex', gap: '0.6em', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                    placeholder="כותרת קטע, למשל: על העסק והמוצר"
                    style={{ flex: 1, fontWeight: 700, background: 'var(--color-white)' }}
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveQuestion(index, -1)} disabled={index === 0} title="הזזה למעלה">
                    ↑
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1} title="הזזה למטה">
                    ↓
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(q.id)} title="הסרת כותרת">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div key={q.id} className="card" style={{ padding: '1.1em' }}>
                <div style={{ display: 'flex', gap: '0.6em', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="field" style={{ marginBottom: '0.7em' }}>
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                        placeholder={`שאלה ${index + 1}`}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1em', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em', fontSize: '0.9rem' }}>
                        <input
                          type="radio"
                          name={`type-${q.id}`}
                          checked={q.type === 'text'}
                          onChange={() => updateQuestion(q.id, { type: 'text' })}
                        />
                        תשובה קצרה
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em', fontSize: '0.9rem' }}>
                        <input
                          type="radio"
                          name={`type-${q.id}`}
                          checked={q.type === 'textarea'}
                          onChange={() => updateQuestion(q.id, { type: 'textarea' })}
                        />
                        תשובה ארוכה
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                        />
                        שאלת חובה
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveQuestion(index, -1)} disabled={index === 0} title="הזזה למעלה">
                      ↑
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1} title="הזזה למטה">
                      ↓
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(q.id)} title="הסרת שאלה">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.8em', marginTop: '1em' }}>
          <button type="button" className="btn btn-secondary" onClick={addQuestion}>
            + הוספת שאלה
          </button>
          <button type="button" className="btn btn-ghost" onClick={addSection}>
            + הוספת כותרת קטע
          </button>
        </div>

        {error && <p style={{ color: 'var(--color-danger)', marginTop: '1em' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.8em', marginTop: '2em' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'שומרת...' : 'שמירת שאלון'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/clients/${clientId}`)}>
            ביטול
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
