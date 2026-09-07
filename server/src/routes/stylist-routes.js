const express = require('express')
const { requireAuth } = require('../middleware/auth-middleware')
const { listConversations, createConversation, getConversation, sendMessage, deleteConversation } = require('../controllers/stylist-controller')

const router = express.Router()
router.use(requireAuth)
router.get('/conversations', listConversations)
router.post('/conversations', createConversation)
router.get('/conversations/:id', getConversation)
router.post('/conversations/:id/messages', sendMessage)
router.delete('/conversations/:id', deleteConversation)

module.exports = router