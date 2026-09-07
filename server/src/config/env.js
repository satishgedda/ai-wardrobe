const path = require('path')
const dotenv = require('dotenv')

// Prefer the server-local file during local development, with the workspace
// root file as a fallback. Existing process environment variables win.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrls: clientUrl.split(',').map((url) => url.trim()).filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === 'true',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
    baseUrl: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
}

function validateEnvironment() {
  if (env.nodeEnv === 'production') {
    const missing = []
    if (!env.mongoUri) missing.push('MONGODB_URI')
    if (!env.jwtSecret || env.jwtSecret.length < 32) missing.push('JWT_SECRET (32+ characters)')
    if (!env.clientUrls.length) missing.push('CLIENT_URL')
    if (missing.length) throw new Error(`Missing production environment variables: ${missing.join(', ')}`)
  }
}

module.exports = { ...env, validateEnvironment }