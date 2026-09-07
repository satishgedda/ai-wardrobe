import { useEffect, useState } from 'react'
import { ArrowLeft, Bookmark, Check, RefreshCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiError } from '../lib/api-client'
import { fetchOutfitRecommendation, saveRecommendedOutfit } from '../lib/weather-api'
import OutfitItemCard from '../components/outfits/OutfitItemCard'
import WeatherPanel from '../components/weather/WeatherPanel'
import { useAuthStore } from '../store/auth-store'
import { useWeatherStore } from '../store/weather-store'

function RecommendationPage() {
  const user = useAuthStore((state) => state.user)
  const { city, setWeather } = useWeatherStore()
  const [draftCity, setDraftCity] = useState(city || user?.location || '')
  const [result, setResult] = useState(null)
  const [variation, setVariation] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function loadRecommendation(nextVariation = variation) {
    if (!draftCity.trim()) return setError('Enter a city to create a weather-aware outfit.')
    setIsLoading(true)
    setError('')
    setSaved(false)
    try {
      const response = await fetchOutfitRecommendation(draftCity.trim(), nextVariation)
      setResult(response)
      setWeather(response.weather, draftCity.trim())
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not create an outfit right now.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (draftCity && !result) loadRecommendation().catch(() => {})
  // The initial request intentionally runs once for the starting city.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    if (!result?.recommendation?.items?.length) return
    setIsSaving(true)
    try {
      await saveRecommendedOutfit({
        clothingItemIds: result.recommendation.items.map((item) => item._id),
        weatherContext: result.weather,
        stylingNotes: result.recommendation.styleDescription,
        aiExplanation: result.recommendation.reason,
      })
      setSaved(true)
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not save this outfit.'))
    } finally {
      setIsSaving(false)
    }
  }

  function handleTryAnother() {
    const nextVariation = variation + 1
    setVariation(nextVariation)
    loadRecommendation(nextVariation).catch(() => {})
  }

  return (
    <main className="recommendation-page">
      <header className="recommendation-header"><Link className="back-link" to="/wardrobe"><ArrowLeft size={15} /> Back to wardrobe</Link><p className="eyebrow">Personal edit</p><h1>Today&apos;s Outfit</h1><p>One considered combination, built from what you own and what the day asks for.</p></header>
      <div className="recommendation-location"><label htmlFor="recommendation-city">Location</label><input id="recommendation-city" value={draftCity} placeholder="Enter a city" onChange={(event) => setDraftCity(event.target.value)} /><button className="primary-button" type="button" onClick={() => loadRecommendation()} disabled={isLoading}><Sparkles size={16} /> {isLoading ? 'Styling...' : 'Create outfit'}</button></div>
      {error && <div className="recommendation-error" role="alert"><TriangleAlert size={17} /> {error}</div>}
      <WeatherPanel initialCity={draftCity} compact />
      {isLoading && <div className="recommendation-loading"><span /><span /><span /></div>}
      {!isLoading && result && <section className="recommendation-result"><div className="result-heading"><div><p className="eyebrow">Your weather-aware edit</p><h2>{result.recommendation.items.length ? 'A look for today' : 'Add a piece to begin'}</h2></div><span className="source-badge"><Sparkles size={13} /> {result.ai?.configured ? 'AI refined' : 'Wardrobe rules'}</span></div>
        {result.recommendation.missingCategories?.length > 0 && <div className="missing-notice"><TriangleAlert size={17} /><div><strong>Optional addition</strong><p>{result.recommendation.missingCategories.join(', ')} could add another layer to this look. We have only used pieces already in your wardrobe.</p></div></div>}
        <div className="outfit-items">{result.recommendation.items.map((item) => <OutfitItemCard item={item} key={item._id} />)}</div>
        <div className="recommendation-copy"><p className="eyebrow">Why it works</p><p>{result.recommendation.reason}</p><span>{result.recommendation.styleDescription}</span></div>
        <div className="recommendation-actions"><button className="outline-button" type="button" onClick={handleTryAnother}><RefreshCcw size={16} /> Try another outfit</button><button className="primary-button" type="button" disabled={!result.recommendation.items.length || isSaving || saved} onClick={handleSave}>{saved ? <><Check size={16} /> Saved</> : <><Bookmark size={16} /> {isSaving ? 'Saving...' : 'Save outfit'}</>}</button></div>
      </section>}
      {!isLoading && !result && !error && <div className="recommendation-empty"><Sparkles size={28} /><h2>Your next look starts with the weather.</h2><p>Choose a location to see an outfit made only from your wardrobe.</p></div>}
    </main>
  )
}

export default RecommendationPage
