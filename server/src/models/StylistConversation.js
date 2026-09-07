const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    referencedClothingItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClothingItem' }],
    referencedOutfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit' },
  },
  { timestamps: true, _id: true },
)

const stylistConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New styling conversation', trim: true, maxlength: 120 },
    messages: { type: [messageSchema], default: [] },
    context: {
      weather: { type: mongoose.Schema.Types.Mixed, default: null },
      occasion: { type: String, default: '' },
      selectedClothingItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClothingItem' }],
    },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
)

stylistConversationSchema.index({ user: 1, lastMessageAt: -1 })

module.exports = mongoose.model('StylistConversation', stylistConversationSchema)