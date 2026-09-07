import { create } from 'zustand'
import { fetchWeather } from '../lib/weather-api'

let inFlightRequest = null

export const useWeatherStore = create((set, get) => ({
  weather: null,
  city: '',
  isLoading: false,
  error: null,
  locationStatus: 'idle',
  locationAttempted: false,
  setLocationError: (message) => set({ isLoading: false, error: message, locationStatus: 'unavailable' }),
  beginLocationAttempt: () => set({ locationAttempted: true, locationStatus: 'requesting' }),
  setWeather: (weather, city = weather?.location || '') => set({ weather, city, error: null }),
  fetchWeatherByCity: (city) => get().requestWeather({ city }),
  fetchWeatherByCoordinates: (lat, lon) => get().requestWeather({ lat, lon }),
  requestWeather: (location) => {
    const requestKey = location.lat !== undefined ? `coordinates:${location.lat}:${location.lon}` : `city:${location.city.trim().toLowerCase()}`
    if (inFlightRequest?.key === requestKey) return inFlightRequest.promise

    set({ isLoading: true, error: null, locationStatus: location.lat !== undefined ? 'detected' : 'manual' })
    const promise = fetchWeather(location)
      .then((weather) => {
        set({ weather, city: weather.location, isLoading: false, error: null })
        return weather
      })
      .catch((error) => {
        set({ isLoading: false, error: error.response?.data?.error?.message || 'We could not load the weather.' })
        throw error
      })
      .finally(() => {
        if (inFlightRequest?.key === requestKey) inFlightRequest = null
      })
    inFlightRequest = { key: requestKey, promise }
    return promise
  },
}))