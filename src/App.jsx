import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Wohnungen from './pages/Wohnungen'
import Dashboard from './pages/Dashboard'
import Buchungen from './pages/Buchungen'
import Nebenkosten from './pages/Nebenkosten'
import Export from './pages/Export'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <div className="loading-screen"><div className="spinner" /></div>
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Wohnungen /></ProtectedRoute>} />
          <Route path="/wohnung/:id" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/wohnung/:id/buchungen" element={<ProtectedRoute><Buchungen /></ProtectedRoute>} />
          <Route path="/wohnung/:id/nebenkosten" element={<ProtectedRoute><Nebenkosten /></ProtectedRoute>} />
          <Route path="/wohnung/:id/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
