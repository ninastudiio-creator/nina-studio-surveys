import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import logo from '../assets/logo.png'

export default function Login() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError('אימייל או סיסמה שגויים')
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: '4em' }}>
      <div style={{ textAlign: 'center', marginBottom: '2em' }}>
        <img src={logo} alt="Nina Studio" className="logo-hero" />
      </div>
      <div className="card">
        <h1 style={{ fontSize: '1.3rem', textAlign: 'center' }}>כניסת מנהלת</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'מתחברת...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
