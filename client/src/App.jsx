import './App.css'
import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WardrobePage from './pages/WardrobePage'
import RecommendationPage from './pages/RecommendationPage'
import StylistPage from './pages/StylistPage'
import DashboardPage from './pages/DashboardPage'
import SavedOutfitsPage from './pages/SavedOutfitsPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuthStore } from './store/auth-store'

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => { restoreSession() }, [restoreSession])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/recommendations" element={<RecommendationPage />} />
          <Route path="/stylist" element={<StylistPage />} />
          <Route path="/outfits" element={<SavedOutfitsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Link to="/">Return home</Link>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
