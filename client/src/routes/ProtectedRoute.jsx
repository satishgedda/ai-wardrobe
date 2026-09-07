import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import AppShell from '../components/layout/AppShell'

function ProtectedRoute() {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <div className="route-loading">Restoring your session...</div>
  }

  return user ? <AppShell><Outlet /></AppShell> : <Navigate to="/login" replace state={{ from: location }} />
}

export default ProtectedRoute