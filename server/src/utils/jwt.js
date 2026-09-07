const jwt = require('jsonwebtoken')
const env = require('../config/env')

function getJwtSecret() {
  if (!env.jwtSecret) throw new Error('JWT_SECRET is not configured')
  return env.jwtSecret
}

function signAccessToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: env.jwtExpiresIn })
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret())
}

module.exports = { signAccessToken, verifyAccessToken }