const ApiError = require('../utils/api-error')
const { success } = require('../utils/api-response')

async function updateProfile(req, res, next) {
  try {
    const { name, profileImage, location, preferences } = req.body
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Name must be at least 2 characters.')
    }
    if (location !== undefined && typeof location !== 'string') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Location must be text.')
    }
    if (preferences !== undefined && (typeof preferences !== 'object' || Array.isArray(preferences))) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Preferences must be an object.')
    }

    if (name !== undefined) req.user.name = name.trim()
    if (profileImage !== undefined) req.user.profileImage = profileImage
    if (location !== undefined) req.user.location = location.trim()
    if (preferences !== undefined) req.user.preferences = { ...req.user.preferences, ...preferences }
    await req.user.save()
    res.json(success({ user: req.user.toSafeObject() }, 'Profile updated'))
  } catch (error) {
    next(error)
  }
}

module.exports = { updateProfile }