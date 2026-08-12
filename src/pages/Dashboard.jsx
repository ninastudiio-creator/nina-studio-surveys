import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

function StatusBadge({ answered }) {
  const style = {
    display: 'inline-block',
    padding: '0.25em 0.8em',
    borderRadius: 999,
    fontSize: '0.8rem',
    fontWeight: 700,
    background: answered ? 'var(--color-blue-light)' : 'var(--color-border)',
    color: 'var(--color-navy)',
  }
  return <span style={style}>{answered ? 'נענה' : 'טרם נענה'}</span>
}

export default function Dashboard() {
  const [surveys, setSurveys] = useState(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  async function loadSurveys() {
    const { data, error } = await supabase
      .from('surveys')
      .select('id, title, public_token, created_at, responses(updated_at)')
      .order('created_at', { ascending: false })

    if (error) {
      setError('שגיאה בטעינת השאלונים')
      return
    }
    setSurveys(data)
  }

  useEffect(() => {
    loadSurveys()
  }, [])

  async function handleDelete(id, title) {
    if (!confirm(`למחוק את השאלון "${title}"? הפעולה לא הפיכה, וכל התשובות שנשמרו יימחקו.`)) return
    const { error } = await supabase.from('surveys').delete().eq('id', id)
    if (error) {
      alert('מחיקה נכשלה')
      return
    }
    setSurveys((prev) => prev.filter((s) => s.id !== id))
  }

  function copyLink(token, id) {
    const url = `${window.location.origin}${window.location.pathname}#/survey/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5em' }}>
        <h1>השאלונים שלי</h1>
        <Link to="/surveys/new" className="btn btn-primary">
          + שאלון חדש
        </Link>
      </div>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {surveys === null && <p>טוען...</p>}

      {surveys?.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          עדיין אין שאלונים. לחצי על "שאלון חדש" כדי ליצור את הראשון.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9em' }}>
        {surveys?.map((survey) => {
          const answered = survey.responses?.length > 0
          return (
            <div key={survey.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '0.3em' }}>
                  <strong>{survey.title}</strong>
                  <StatusBadge answered={answered} />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  נוצר ב-{new Date(survey.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => copyLink(survey.public_token, survey.id)}>
                  {copiedId === survey.id ? 'הועתק!' : 'העתקת קישור'}
                </button>
                <Link to={`/surveys/${survey.id}/responses`} className="btn btn-ghost btn-sm">
                  תשובות
                </Link>
                <Link to={`/surveys/${survey.id}/edit`} className="btn btn-ghost btn-sm">
                  עריכה
                </Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(survey.id, survey.title)}>
                  מחיקה
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
