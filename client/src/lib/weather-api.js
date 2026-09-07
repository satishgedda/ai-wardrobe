import apiClient from './api-client'

export async function fetchWeather({ city, lat, lon }) {
  const response = await apiClient.get('/weather', { params: lat !== undefined && lon !== undefined ? { lat, lon } : { city } })
  return response.data.data.weather
}

export async function fetchOutfitRecommendation(city, variation = 1) {
  const response = await apiClient.post('/recommendations/outfit', { city, variation })
  return response.data.data
}

export async function saveRecommendedOutfit(payload) {
  const response = await apiClient.post('/recommendations/outfit/save', payload)
  return response.data.data.outfit
}