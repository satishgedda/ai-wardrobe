import { useState } from 'react'
import { ArrowLeft, Check, MapPin, Save, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import apiClient from '../lib/api-client'
import { useAuthStore } from '../store/auth-store'

function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [name, setName] = useState(user?.name || '')
  const [location, setLocation] = useState(user?.location || '')
  const [style, setStyle] = useState(user?.preferences?.style || '')
  const [favoriteColors, setFavoriteColors] = useState((user?.preferences?.favoriteColors || []).join(', '))
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault(); setIsSaving(true); setSaved(false); setError('')
    try { const response = await apiClient.patch('/users/me', { name, location, preferences: { style, favoriteColors: favoriteColors.split(',').map((color) => color.trim()).filter(Boolean) } }); setUser(response.data.data.user); setSaved(true) } catch (requestError) { setError(getApiError(requestError, 'We could not update your profile.')) } finally { setIsSaving(false) }
  }

  return <main className="profile-page"><header className="profile-header"><Link className="back-link" to="/"><ArrowLeft size={15} /> Overview</Link><div className="profile-title"><span className="large-avatar"><UserRound size={28} /></span><div><p className="eyebrow">Your account</p><h1>Profile & preferences</h1><p>Tell AI Wardrobe what makes a recommendation feel like yours.</p></div></div></header><form className="profile-form" onSubmit={handleSubmit}><div className="profile-section"><p className="eyebrow">Identity</p><label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email<input value={user?.email || ''} disabled /></label></div><div className="profile-section"><p className="eyebrow">Recommendation context</p><label><span><MapPin size={15} /> Home location</span><input value={location} placeholder="e.g. London" onChange={(event) => setLocation(event.target.value)} /></label><label>Style direction<input value={style} placeholder="e.g. minimal, relaxed tailoring" onChange={(event) => setStyle(event.target.value)} /></label><label>Favorite colors<input value={favoriteColors} placeholder="e.g. navy, cream, olive" onChange={(event) => setFavoriteColors(event.target.value)} /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="profile-submit"><button className="primary-button" type="submit" disabled={isSaving}>{saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {isSaving ? 'Saving...' : 'Save preferences'}</>}</button></div></form></main>
}

export default ProfilePage
