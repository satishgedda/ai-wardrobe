const mongoose = require('mongoose')
const ApiError = require('../utils/api-error')
const ClothingItem = require('../models/ClothingItem')
const StylistConversation = require('../models/StylistConversation')
const { validateMessage } = require('../validators/stylist-validator')
const { generateStylistReply } = require('../services/stylist-service')
const { success } = require('../utils/api-response')

const MAX_CONTEXT_MESSAGES = 12
const MAX_CONVERSATIONS = 50

function ensureValidConversationId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_CONVERSATION_ID', 'The conversation ID is invalid.')
}

async function listConversations(req, res, next) {
  try {
    const conversations = await StylistConversation.find({ user: req.user.id })
      .select('title lastMessageAt createdAt updatedAt')
      .sort({ lastMessageAt: -1 })
      .limit(MAX_CONVERSATIONS)
      .lean()
    res.json(success({ conversations }))
  } catch (error) {
    next(error)
  }
}

async function createConversation(req, res, next) {
  try {
    const conversation = await StylistConversation.create({
      user: req.user.id,
      title: typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 120) : 'New styling conversation',
      context: { occasion: typeof req.body.occasion === 'string' ? req.body.occasion.trim().slice(0, 120) : '' },
    })
    res.status(201).json(success({ conversation }, 'Conversation created'))
  } catch (error) {
    next(error)
  }
}

async function getConversation(req, res, next) {
  try {
    ensureValidConversationId(req.params.id)
    const conversation = await StylistConversation.findOne({ _id: req.params.id, user: req.user.id }).lean()
    if (!conversation) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'That conversation could not be found.')
    res.json(success({ conversation }))
  } catch (error) {
    next(error)
  }
}

async function sendMessage(req, res, next) {
  try {
    ensureValidConversationId(req.params.id)
    const validationError = validateMessage(req.body.content)
    if (validationError) throw new ApiError(400, 'VALIDATION_ERROR', validationError)

    const conversation = await StylistConversation.findOne({ _id: req.params.id, user: req.user.id })
    if (!conversation) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'That conversation could not be found.')

    const wardrobeItems = await ClothingItem.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100).lean()
    const wardrobe = wardrobeItems.map((item) => ({
      id: item._id.toString(),
      category: item.category,
      subcategory: item.subcategory,
      color: item.color,
      secondaryColors: item.secondaryColors,
      season: item.season,
      occasions: item.occasions,
      styleTags: item.styleTags,
      brand: item.brand,
    }))
    const history = conversation.messages.slice(-MAX_CONTEXT_MESSAGES).map((entry) => ({ role: entry.role, content: entry.content }))
    const userContent = req.body.content.trim()
    const reply = await generateStylistReply({ message: userContent, history, wardrobe, context: conversation.context })

    conversation.messages.push({ role: 'user', content: userContent })
    conversation.messages.push(reply)
    conversation.messages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES)
    conversation.lastMessageAt = new Date()
    if (conversation.title === 'New styling conversation') conversation.title = userContent.slice(0, 70)
    await conversation.save()

    res.json(success({ message: reply, conversation }))
  } catch (error) {
    next(error)
  }
}

async function deleteConversation(req, res, next) {
  try {
    ensureValidConversationId(req.params.id)
    const conversation = await StylistConversation.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!conversation) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'That conversation could not be found.')
    res.json(success({ id: conversation.id }, 'Conversation deleted'))
  } catch (error) {
    next(error)
  }
}

module.exports = { listConversations, createConversation, getConversation, sendMessage, deleteConversation }