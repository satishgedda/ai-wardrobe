import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CloudSun, Shirt, Sparkles, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import { fetchOutfitRecommendation } from '../lib/weather-api'
import { useAuthStore } from '../store/auth-store'
import { useWardrobeStore } from '../store/wardrobe-store'
import WeatherPanel from '../components/weather/WeatherPanel'

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { items, fetchItems } = useWardrobeStore()
  const [recommendation, setRecommendation] = useState(null)
  const [recommendationError, setRecommendationError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { fetchItems().catch(() => {}) }, [fetchItems])
  useEffect(() => {
    if (!user?.location) return
    const request = setTimeout(() => {
      setIsLoading(true)
      fetchOutfitRecommendation(user.location).then(setRecommendation).catch((error) => setRecommendationError(getApiError(error, 'Add your weather API key to see a daily recommendation.'))).finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(request)
  }, [user?.location])

  const categoryCount = useMemo(() => new Set(items.map((item) => item.category).filter(Boolean)).size, [items])
  const recommendationItems = recommendation?.recommendation?.items || []

  return (
    <main className="dashboard-page">
      <header className="dashboard-header"><div><p className="eyebrow">Your daily edit</p><h1>Good morning, {user?.name?.split(' ')[0] || 'there'}.</h1><p>Make getting dressed feel a little more considered.</p></div><Link className="dashboard-profile" to="/profile"><span className="avatar-mark">{user?.name?.slice(0, 1).toUpperCase()}</span><span>{user?.location || 'Set your location'}</span></Link></header>
      <section className="dashboard-grid"><WeatherPanel initialCity={user?.location || ''} /><div className="dashboard-card recommendation-card"><div className="dashboard-card-heading"><div><p className="eyebrow">A considered start</p><h2>Today&apos;s outfit</h2></div><WandSparkles size={21} /></div>{isLoading && <div className="dashboard-loading">Finding a look from your wardrobe...</div>}{!isLoading && recommendationError && <div className="dashboard-muted"><CloudSun size={24} /><p>{recommendationError}</p></div>}{!isLoading && !recommendationError && recommendationItems.length > 0 && <><div className="dashboard-outfit-images">{recommendationItems.slice(0, 4).map((item) => <img key={item._id} src={item.imageUrl} alt={item.category || 'Wardrobe item'} />)}</div><p className="dashboard-reason">{recommendation.recommendation.reason}</p></>}{!isLoading && !recommendationError && !recommendationItems.length && <div className="dashboard-muted"><Sparkles size={24} /><p>Add categorized wardrobe pieces to unlock a daily outfit.</p></div>}<Link className="card-link" to="/recommendations">Open today&apos;s outfit <ArrowRight size={15} /></Link></div></section>
      <section className="dashboard-stats"><div className="stat-card"><Shirt size={20} /><strong>{items.length}</strong><span>Pieces in wardrobe</span></div><div className="stat-card"><Sparkles size={20} /><strong>{categoryCount}</strong><span>Categories covered</span></div><div className="stat-card"><span className="stat-symbol">♡</span><strong>{recommendationItems.length}</strong><span>Pieces in today&apos;s look</span></div></section>
      <section className="dashboard-actions"><Link to="/wardrobe"><Shirt size={18} /><strong>Manage wardrobe</strong><span>Upload and organize your pieces</span><ArrowRight size={16} /></Link><Link to="/stylist"><Sparkles size={18} /><strong>Ask your AI stylist</strong><span>Get a second opinion on your look</span><ArrowRight size={16} /></Link><Link to="/profile"><span className="action-symbol">◎</span><strong>Set your preferences</strong><span>Make recommendations more personal</span><ArrowRight size={16} /></Link></section>
    </main>
  )
}

export default DashboardPage
