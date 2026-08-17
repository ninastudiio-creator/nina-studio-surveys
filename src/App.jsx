import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ClientsList from './pages/ClientsList'
import ClientDetail from './pages/ClientDetail'
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
              <ClientsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId"
          element={
            <ProtectedRoute>
              <ClientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId/survey/new"
          element={
            <ProtectedRoute>
              <SurveyEditor isEditing={false} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId/survey/edit"
          element={
            <ProtectedRoute>
              <SurveyEditor isEditing={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId/survey/responses"
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
