import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

const SAVE_DELAY = 800

function instagramHref(value) {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

const SurveyTileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
  </svg>
)

const SummaryTileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 20V6a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M14 4v5a1 1 0 0 0 1 1h5" />
    <path d="M8 13h8M8 17h5" strokeLinecap="round" />
  </svg>
)

export default function ClientDetail() {
  const { clientId } = useParams()

  const [client, setClient] = useState(null)
  const [fields, setFields] = useState({ phone: '', email: '', instagram: '', project_start_date: '' })
  const [survey, setSurvey] = useState(undefined) // undefined = loading, null = none yet
  const [fieldsSaveState, setFieldsSaveState] = useState('idle') // idle | saving | saved
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const saveTimer = useRef(null)

  async function load() {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name, phone, email, instagram, project_start_date, discovery_summary')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      setError('הלקוח לא נמצא')
      return
    }
    setClient(clientData)
    setFields({
      phone: clientData.phone || '',
      email: clientData.email || '',
      instagram: clientData.instagram || '',
      project_start_date: clientData.project_start_date || '',
    })

    const { data: surveyData } = await supabase
      .from('surveys')
      .select('id, public_token, responses(updated_at)')
      .eq('client_id', clientId)
      .maybeSingle()

    setSurvey(surveyData || null)
  }

  useEffect(() => {
    load()
  }, [clientId])

  const persistFields = useCallback(
    (nextFields) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setFieldsSaveState('saving')
      saveTimer.current = setTimeout(async () => {
        const { error } = await supabase
          .from('clients')
          .update({ ...nextFields, project_start_date: nextFields.project_start_date || null })
          .eq('id', clientId)
        setFieldsSaveState(error ? 'idle' : 'saved')
      }, SAVE_DELAY)
    },
    [clientId]
  )

  function handleFieldChange(key, value) {
    setFields((prev) => {
      const next = { ...prev, [key]: value }
      persistFields(next)
      return next
    })
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#/survey/${survey.public_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
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
  const igHref = instagramHref(fields.instagram)

  return (
    <AdminLayout>
      <Link to="/" style={{ fontSize: '0.9rem' }}>
        ← חזרה ללקוחות שלי
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8em', marginTop: '0.5em' }}>
        <h1 style={{ margin: 0 }}>{client.name}</h1>
        {survey && (
          <button className="btn btn-secondary btn-sm" onClick={copyLink}>
            {copied ? 'הועתק!' : 'העתקת קישור השאלון'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.8em' }}>
        <h3 style={{ margin: 0 }}>פרטי לקוח</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {fieldsSaveState === 'saving' ? 'שומר...' : fieldsSaveState === 'saved' ? '✓ נשמר' : ''}
        </span>
      </div>

      <div className="card client-fields-grid" style={{ marginTop: '0.6em' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="phone">טלפון</label>
          <input
            id="phone"
            type="text"
            value={fields.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="050-1234567"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            type="email"
            value={fields.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="client@example.com"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="instagram">
            אינסטגרם {igHref && (
              <a href={igHref} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>
                (פתיחה ↗)
              </a>
            )}
          </label>
          <input
            id="instagram"
            type="text"
            value={fields.instagram}
            onChange={(e) => handleFieldChange('instagram', e.target.value)}
            placeholder="@username או קישור מלא"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="start-date">תאריך תחילת פרויקט</label>
          <input
            id="start-date"
            type="date"
            value={fields.project_start_date}
            onChange={(e) => handleFieldChange('project_start_date', e.target.value)}
          />
        </div>
      </div>

      <h3 style={{ marginTop: '1.8em' }}>התיקייה</h3>
      <div className="tile-grid">
        <Link to={`/clients/${clientId}/survey`} className="tile">
          <div className="tile-icon">
            <SurveyTileIcon />
          </div>
          <div className="tile-title">שאלון אפיון</div>
          <div className="tile-status">
            {survey === undefined && 'טוען...'}
            {survey === null && 'לא נוצר עדיין'}
            {survey && (answered ? 'נענה' : 'טרם נענה')}
          </div>
        </Link>

        <Link to={`/clients/${clientId}/summary`} className="tile">
          <div className="tile-icon">
            <SummaryTileIcon />
          </div>
          <div className="tile-title">סיכום שיחת אפיון</div>
          <div className="tile-status">
            {client.discovery_summary?.replace(/<[^>]*>/g, '').trim() ? 'יש תוכן' : 'עדיין ריק'}
          </div>
        </Link>
      </div>
    </AdminLayout>
  )
}
