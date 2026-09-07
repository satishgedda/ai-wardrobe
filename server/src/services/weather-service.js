const env = require('../config/env')
const ApiError = require('../utils/api-error')

function assertConfigured() {
  if (!env.weather.apiKey) throw new ApiError(503, 'WEATHER_NOT_CONFIGURED', 'Weather service is not configured.')
}

async function requestWeather(path, location) {
  const url = new URL(`${env.weather.baseUrl}${path}`)
  if (location.lat !== undefined && location.lon !== undefined) {
    url.searchParams.set('lat', location.lat)
    url.searchParams.set('lon', location.lon)
  } else {
    url.searchParams.set('q', location.city)
  }
  url.searchParams.set('units', 'metric')
  url.searchParams.set('appid', env.weather.apiKey)

  let response
  try {
    response = await fetch(url)
  } catch (error) {
    throw new ApiError(502, 'WEATHER_UNAVAILABLE', 'Weather service is temporarily unavailable.')
  }

  if (response.status === 404) throw new ApiError(404, 'LOCATION_NOT_FOUND', 'That location could not be found.')
  if (response.status === 429) throw new ApiError(429, 'WEATHER_RATE_LIMITED', 'Weather service is temporarily rate-limited. Try again shortly.')
  if (!response.ok) throw new ApiError(502, 'WEATHER_PROVIDER_ERROR', 'Weather service returned an error.')
  return response.json()
}

function normalizeCurrent(data) {
  return {
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    condition: data.weather?.[0]?.description || 'Unknown conditions',
    conditionGroup: data.weather?.[0]?.main || 'Unknown',
    icon: data.weather?.[0]?.icon || '',
    humidity: data.main.humidity,
    windSpeed: Math.round((data.wind?.speed || 0) * 3.6),
    precipitation: data.rain?.['1h'] || data.rain?.['3h'] || 0,
    precipitationProbability: null,
  }
}

function normalizeForecast(data) {
  return (data.list || []).slice(0, 5).map((entry) => ({
    time: entry.dt_txt,
    temperature: Math.round(entry.main.temp),
    condition: entry.weather?.[0]?.description || 'Unknown conditions',
    conditionGroup: entry.weather?.[0]?.main || 'Unknown',
    icon: entry.weather?.[0]?.icon || '',
    precipitationProbability: Math.round((entry.pop || 0) * 100),
  }))
}

async function getWeather(location) {
  assertConfigured()
  const isCoordinateRequest = location && location.lat !== undefined && location.lon !== undefined
  const normalizedCity = typeof location === 'string' ? location.trim() : location?.city?.trim()
  const latitude = isCoordinateRequest ? Number(location.lat) : null
  const longitude = isCoordinateRequest ? Number(location.lon) : null
  const validCoordinates = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
  if (isCoordinateRequest && !validCoordinates) throw new ApiError(400, 'INVALID_COORDINATES', 'The location coordinates are invalid.')
  if (!isCoordinateRequest && !normalizedCity) throw new ApiError(400, 'CITY_REQUIRED', 'Provide a city or location coordinates to get the weather.')
  const requestLocation = isCoordinateRequest ? { lat: latitude, lon: longitude } : { city: normalizedCity }

  const [currentData, forecastData] = await Promise.all([
    requestWeather('/weather', requestLocation),
    requestWeather('/forecast', requestLocation),
  ])

  return {
    location: currentData.name,
    country: currentData.sys?.country || '',
    coordinates: currentData.coord ? { lat: currentData.coord.lat, lon: currentData.coord.lon } : null,
    current: normalizeCurrent(currentData),
    forecast: normalizeForecast(forecastData),
    fetchedAt: new Date().toISOString(),
  }
}

module.exports = { getWeather }