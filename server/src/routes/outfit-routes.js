const express = require('express')
const { requireAuth } = require('../middleware/auth-middleware')
const { listSavedOutfits, unsaveOutfit, deleteOutfit } = require('../controllers/outfit-controller')

const router = express.Router()
router.use(requireAuth)
router.get('/', listSavedOutfits)
router.patch('/:id/save', unsaveOutfit)
router.delete('/:id', deleteOutfit)

module.exports = router