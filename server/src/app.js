const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const env = require('./config/env')
const { notFoundHandler, errorHandler } = require('./middleware/error-middleware')
const { success } = require('./utils/api-response')
const authRoutes = require('./routes/auth-routes')
const wardrobeRoutes = require('./routes/wardrobe-routes')
const weatherRoutes = require('./routes/weather-routes')
const recommendationRoutes = require('./routes/recommendation-routes')
const stylistRoutes = require('./routes/stylist-routes')
const userRoutes = require('./routes/user-routes')
const outfitRoutes = require('./routes/outfit-routes')
const { requestContext } = require('./middleware/request-context-middleware')
const { apiRateLimiter, authRateLimiter, aiRateLimiter } = require('./middleware/rate-limit-middleware')
const { getDatabaseStatus } = require('./config/database')
const ApiError = require('./utils/api-error')

const app = express()

app.set('trust proxy', env.trustProxy)
app.use(helmet())
app.use(requestContext)
app.use(cors({ origin: (origin, callback) => {
  if (env.nodeEnv !== 'production') return callback(null, true)
  if (!origin || env.clientUrls.includes(origin)) return callback(null, true)
  return callback(new ApiError(403, 'CORS_ORIGIN_NOT_ALLOWED', 'This origin is not allowed to access the API.'))
}, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', apiRateLimiter)

app.get('/api/v1/health', (req, res) => {
  res.json(success({ status: 'ok', service: 'ai-wardrobe-api', requestId: req.requestId }))
})

app.get('/api/v1/health/ready', (req, res) => {
  const database = getDatabaseStatus()
  const ready = !database.configured || database.connected
  res.status(ready ? 200 : 503).json(success({ status: ready ? 'ready' : 'not-ready', service: 'ai-wardrobe-api', database, requestId: req.requestId }))
})

app.use('/api/v1/auth', authRateLimiter, authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/wardrobe', wardrobeRoutes)
app.use('/api/v1/outfits', outfitRoutes)
app.use('/api/v1/weather', aiRateLimiter, weatherRoutes)
app.use('/api/v1/recommendations', aiRateLimiter, recommendationRoutes)
app.use('/api/v1/stylist', aiRateLimiter, stylistRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app