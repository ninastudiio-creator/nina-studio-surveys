import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

export default function SurveyResponses() {
  const { clientId } = useParams()
  const [survey, setSurvey] = useState(null)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('id, title, questions, public_token')
        .eq('client_id', clientId)
        .single()

      if (surveyError || !surveyData) {
        setError('השאלון לא נמצא')
        return
      }
      setSurvey(surveyData)

      const { data: responseData } = await supabase
        .from('responses')
        .select('answers, updated_at')
        .eq('survey_id', surveyData.id)
        .maybeSingle()

      setResponse(responseData)
    }
    load()
  }, [clientId])

  if (error) {
    return (
      <AdminLayout>
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </AdminLayout>
    )
  }

  if (!survey) {
    return (
      <AdminLayout>
        <p>טוען...</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Link to={`/clients/${clientId}/survey`} style={{ fontSize: '0.9rem' }}>
        ← חזרה לשאלון
      </Link>
      <h1 style={{ marginTop: '0.5em' }}>{survey.title}</h1>

      {!response && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          עדיין לא התקבלה תשובה לשאלון הזה.
        </div>
      )}

      {response && (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            עודכן לאחרונה: {new Date(response.updated_at).toLocaleString('he-IL')}
          </p>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.3em' }}>
            {survey.questions.map((q) =>
              q.type === 'section' ? (
                <h3 key={q.id} style={{ margin: 0 }}>
                  {q.label}
                </h3>
              ) : (
                <div key={q.id}>
                  <div style={{ fontWeight: 400, marginBottom: '0.3em' }}>{q.label}</div>
                  <div style={{ whiteSpace: 'pre-wrap', color: response.answers?.[q.id] ? 'var(--color-navy)' : 'var(--color-text-muted)' }}>
                    {response.answers?.[q.id] || 'לא נענה'}
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
