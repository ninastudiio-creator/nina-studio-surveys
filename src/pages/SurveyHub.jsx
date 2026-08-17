import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

export default function SurveyHub() {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [clientName, setClientName] = useState('')
  const [survey, setSurvey] = useState(undefined) // undefined = loading, null = none yet
  const [copied, setCopied] = useState(false)

  async function load() {
    const { data: clientData } = await supabase.from('clients').select('name').eq('id', clientId).single()
    setClientName(clientData?.name || '')

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
    navigate(`/clients/${clientId}`)
  }

  const answered = Boolean(survey?.responses)

  return (
    <AdminLayout>
      <Link to={`/clients/${clientId}`} style={{ fontSize: '0.9rem' }}>
        ← חזרה ל{clientName || 'לקוח'}
      </Link>
      <h1 style={{ marginTop: '0.5em' }}>שאלון אפיון</h1>

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
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '1.2em', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={copyLink}>
              {copied ? 'הועתק!' : 'העתקת קישור'}
            </button>
            <Link to={`/clients/${clientId}/survey/responses`} className="btn btn-ghost btn-sm">
              תשובות
            </Link>
            <Link to={`/clients/${clientId}/survey/edit`} className="btn btn-ghost btn-sm">
              עריכת שאלות
            </Link>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteSurvey}>
              מחיקה
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
