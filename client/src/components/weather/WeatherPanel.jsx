import { useEffect, useState } from 'react'
import { Cloud, CloudRain, CloudSun, Droplets, MapPin, RefreshCcw, Search, Snowflake, Sun, Wind } from 'lucide-react'
import { motion } from 'framer-motion'
import { useWeatherStore } from '../../store/weather-store'

function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location detection is not available in this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  })
}

function WeatherIcon({ condition, size = 24 }) {
  const value = condition?.toLowerCase() || ''
  if (value.includes('rain') || value.includes('drizzle')) return <CloudRain size={size} />
  if (value.includes('snow')) return <Snowflake size={size} />
  if (value.includes('clear')) return <Sun size={size} />
  if (value.includes('cloud')) return <CloudSun size={size} />
  return <Cloud size={size} />
}

function formatForecastTime(value) {
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: 'short' })
}

function WeatherPanel({ initialCity = '', compact = false }) {
  const { weather, city, isLoading, error, locationAttempted, fetchWeatherByCity, fetchWeatherByCoordinates, setLocationError, beginLocationAttempt } = useWeatherStore()
  const [draftCity, setDraftCity] = useState(() => city || initialCity)

  useEffect(() => {
    if (weather || isLoading || locationAttempted) return
    beginLocationAttempt()
    detectLocation()
      .then(({ lat, lon }) => fetchWeatherByCoordinates(lat, lon).catch(() => {}))
      .catch(() => {
        if (initialCity) return fetchWeatherByCity(initialCity)
        setLocationError('Location access was unavailable. Search for a city to see weather.')
        return null
      })
      .catch(() => {})
  }, [beginLocationAttempt, fetchWeatherByCity, fetchWeatherByCoordinates, initialCity, isLoading, locationAttempted, setLocationError, weather])

  async function handleSubmit(event) {
    event.preventDefault()
    if (draftCity.trim()) await fetchWeatherByCity(draftCity.trim()).catch(() => {})
  }

  return (
    <section className={`weather-panel ${compact ? 'weather-panel-compact' : ''}`}>
      <div className="weather-panel-header">
        <div><p className="eyebrow">The conditions</p><h2>Weather now</h2></div>
        <form className="weather-search" onSubmit={handleSubmit}><MapPin size={15} /><input value={draftCity || weather?.location || ''} placeholder="Enter a city" aria-label="Weather city" onChange={(event) => setDraftCity(event.target.value)} /><button type="submit" aria-label="Search weather" disabled={isLoading}><Search size={15} /></button></form>
      </div>
      {isLoading && <div className="weather-loading"><span /><span /><span /></div>}
      {!isLoading && error && <div className="weather-error"><p>{error}</p><button type="button" className="icon-button" aria-label="Retry weather" onClick={handleSubmit}><RefreshCcw size={16} /></button></div>}
      {!isLoading && !error && !weather && <div className="weather-empty"><CloudSun size={30} /><p>Choose a city to see the conditions shaping today&apos;s edit.</p></div>}
      {!isLoading && !error && weather && (
        <motion.div className="weather-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="weather-current"><div className="weather-symbol"><WeatherIcon condition={weather.current.conditionGroup} size={34} /></div><div><strong>{weather.current.temperature}°</strong><p>{weather.current.condition}</p><span><MapPin size={12} /> {weather.location}{weather.country ? `, ${weather.country}` : ''}</span></div></div>
          <div className="weather-metrics"><span><strong>{weather.current.feelsLike}°</strong>Feels like</span><span><strong>{weather.current.humidity}%</strong><Droplets size={14} /> Humidity</span><span><strong>{weather.current.windSpeed} km/h</strong><Wind size={14} /> Wind</span><span><strong>{weather.current.precipitationProbability ?? weather.current.precipitation}%</strong><CloudRain size={14} /> Rain</span></div>
          {weather.forecast?.length > 0 && <div className="forecast-strip">{weather.forecast.slice(0, compact ? 3 : 5).map((entry) => <div className="forecast-item" key={entry.time}><span>{formatForecastTime(entry.time)}</span><WeatherIcon condition={entry.conditionGroup} size={17} /><strong>{entry.temperature}°</strong><small>{entry.precipitationProbability}% rain</small></div>)}</div>}
        </motion.div>
      )}
    </section>
  )
}

export default WeatherPanel
