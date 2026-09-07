const express = require('express')
const { requireAuth } = require('../middleware/auth-middleware')
const { recommendOutfit, saveOutfit } = require('../controllers/recommendation-controller')

const router = express.Router()
router.use(requireAuth)
router.post('/outfit', recommendOutfit)
router.post('/outfit/save', saveOutfit)

module.exports = router