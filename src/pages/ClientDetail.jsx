import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

const SAVE_DELAY = 800

export default function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [survey, setSurvey] = useState(undefined) // undefined = loading, null = none yet
  const [summary, setSummary] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const saveTimer = useRef(null)

  async function load() {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name, discovery_summary')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      setError('הלקוח לא נמצא')
      return
    }
    setClient(clientData)
    setSummary(clientData.discovery_summary || '')

    const { data: surveyData } = await supabase
      .from('surveys')
      .select('id, title, public_token, responses(updated_at)')
      .eq('client_id', clientId)
      .maybeSingle()

    setSurvey(surveyData || null)
  }

  useEffect(() => {
    load()
  }, [clientId])

  const persistSummary = useCallback(
    (value) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveState('saving')
      saveTimer.current = setTimeout(async () => {
        const { error } = await supabase.from('clients').update({ discovery_summary: value }).eq('id', clientId)
        setSaveState(error ? 'idle' : 'saved')
      }, SAVE_DELAY)
    },
    [clientId]
  )

  function handleSummaryChange(value) {
    setSummary(value)
    persistSummary(value)
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#/survey/${survey.public_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  async function handleDeleteSurvey() {
    if (!confirm('למחוק את השאלון? כל התשובות שנשמרו יימחקו.')) return
    const { error } = await supabase.from('surveys').delete().eq('id', survey.id)
    if (error) {
      alert('מחיקה נכשלה')
      return
    }
    setSurvey(null)
  }

  if (error) {
    return (
      <AdminLayout>
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </AdminLayout>
    )
  }

  if (!client) {
    return (
      <AdminLayout>
        <p>טוען...</p>
      </AdminLayout>
    )
  }

  const answered = survey?.responses?.length > 0

  return (
    <AdminLayout>
      <Link to="/" style={{ fontSize: '0.9rem' }}>
        ← חזרה ללקוחות שלי
      </Link>
      <h1 style={{ marginTop: '0.5em' }}>{client.name}</h1>

      <h3 style={{ marginTop: '1.5em' }}>השאלון</h3>
      {survey === undefined && <p>טוען...</p>}

      {survey === null && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>עדיין אין שאלון ללקוח הזה.</p>
          <Link to={`/clients/${clientId}/survey/new`} className="btn btn-primary">
            + יצירת שאלון
          </Link>
        </div>
      )}

      {survey && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '0.3em' }}>
              <strong>{survey.title}</strong>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25em 0.8em',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: answered ? 'var(--color-blue-light)' : 'var(--color-border)',
                  color: 'var(--color-navy)',
                }}
              >
                {answered ? 'נענה' : 'טרם נענה'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={copyLink}>
              {copied ? 'הועתק!' : 'העתקת קישור'}
            </button>
            <Link to={`/clients/${clientId}/survey/responses`} className="btn btn-ghost btn-sm">
              תשובות
            </Link>
            <Link to={`/clients/${clientId}/survey/edit`} className="btn btn-ghost btn-sm">
              עריכה
            </Link>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteSurvey}>
              מחיקה
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2em' }}>
        <h3 style={{ margin: 0 }}>סיכום שיחת אפיון</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {saveState === 'saving' ? 'שומר...' : saveState === 'saved' ? '✓ נשמר' : ''}
        </span>
      </div>
      <div className="card" style={{ marginTop: '0.6em' }}>
        <textarea
          value={summary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          placeholder="רשמי כאן את הסיכום שלך מהשיחה עם הלקוחה — נקודות מפתח, החלטות, מה סוכם..."
          style={{ minHeight: '14em', border: 'none', padding: 0 }}
        />
      </div>
    </AdminLayout>
  )
}
