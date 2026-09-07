const express = require('express')
const { requireAuth } = require('../middleware/auth-middleware')
const { updateProfile } = require('../controllers/user-controller')

const router = express.Router()
router.use(requireAuth)
router.patch('/me', updateProfile)

module.exports = router