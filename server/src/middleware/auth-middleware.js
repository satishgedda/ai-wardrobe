const User = require('../models/User')
const ApiError = require('../utils/api-error')
const { verifyAccessToken } = require('../utils/jwt')
const { getCookie } = require('../utils/auth-cookie')

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''
    const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : null
    const token = getCookie(req, 'accessToken') || bearerToken

    if (!token) throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.')

    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.userId)
    if (!user) throw new ApiError(401, 'INVALID_SESSION', 'The session is no longer valid.')

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'INVALID_SESSION', 'The session is no longer valid.'))
    }
    next(error)
  }
}

module.exports = { requireAuth }