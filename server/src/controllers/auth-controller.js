const User = require('../models/User')
const ApiError = require('../utils/api-error')
const { validateCredentials } = require('../validators/auth-validator')
const { signAccessToken } = require('../utils/jwt')
const { setAuthCookie, clearAuthCookie } = require('../utils/auth-cookie')
const { success } = require('../utils/api-response')

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

async function register(req, res, next) {
  try {
    const { name, email, password, profileImage, location, preferences } = req.body
    const errors = validateCredentials({ name, email, password }, true)
    if (Object.keys(errors).length) throw new ApiError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', errors)

    const normalizedEmail = normalizeEmail(email)
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) throw new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'An account with that email already exists.')

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      profileImage: profileImage || '',
      location: location || '',
      preferences: preferences || {},
    })

    setAuthCookie(res, signAccessToken(user.id))
    res.status(201).json(success({ user: user.toSafeObject() }, 'Account created'))
  } catch (error) {
    if (error.code === 11000) return next(new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'An account with that email already exists.'))
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const errors = validateCredentials({ email, password })
    if (Object.keys(errors).length) throw new ApiError(400, 'VALIDATION_ERROR', 'Please enter a valid email and password.', errors)

    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    }

    setAuthCookie(res, signAccessToken(user.id))
    res.json(success({ user: user.toSafeObject() }, 'Logged in'))
  } catch (error) {
    next(error)
  }
}

function logout(req, res) {
  clearAuthCookie(res)
  res.json(success(null, 'Logged out'))
}

function getCurrentUser(req, res) {
  res.json(success({ user: req.user.toSafeObject() }))
}

module.exports = { register, login, logout, getCurrentUser }