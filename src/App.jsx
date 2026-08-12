import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SurveyEditor from './pages/SurveyEditor'
import SurveyResponses from './pages/SurveyResponses'
import PublicSurvey from './pages/PublicSurvey'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/survey/:token" element={<PublicSurvey />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/surveys/new"
          element={
            <ProtectedRoute>
              <SurveyEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/surveys/:id/edit"
          element={
            <ProtectedRoute>
              <SurveyEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/surveys/:id/responses"
          element={
            <ProtectedRoute>
              <SurveyResponses />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
