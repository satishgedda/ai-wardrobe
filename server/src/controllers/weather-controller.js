const ApiError = require('../utils/api-error')
const { getWeather } = require('../services/weather-service')
const { success } = require('../utils/api-response')

async function getCurrentWeather(req, res, next) {
  try {
    const hasCoordinates = req.query.lat !== undefined || req.query.lon !== undefined
    if (hasCoordinates && (req.query.lat === undefined || req.query.lon === undefined)) {
      throw new ApiError(400, 'INVALID_COORDINATES', 'Both latitude and longitude are required.')
    }
    const location = hasCoordinates
      ? { lat: req.query.lat, lon: req.query.lon }
      : { city: req.query.city || req.user.location }
    const weather = await getWeather(location)
    res.json(success({ weather }))
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(502, 'WEATHER_UNAVAILABLE', 'Weather service is temporarily unavailable.'))
  }
}

module.exports = { getCurrentWeather }