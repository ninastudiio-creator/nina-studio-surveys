import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="container">טוען...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
