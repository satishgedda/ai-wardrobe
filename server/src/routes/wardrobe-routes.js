const express = require('express')
const { requireAuth } = require('../middleware/auth-middleware')
const { clothingUpload } = require('../middleware/upload-middleware')
const { createItem, listItems, getItem, updateItem, deleteItem } = require('../controllers/wardrobe-controller')

const router = express.Router()

router.use(requireAuth)
router.post('/items', clothingUpload.single('image'), createItem)
router.get('/items', listItems)
router.get('/items/:id', getItem)
router.patch('/items/:id', updateItem)
router.delete('/items/:id', deleteItem)

module.exports = router
