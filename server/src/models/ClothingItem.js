const mongoose = require('mongoose')

const clothingItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true, unique: true },
    resourceType: { type: String, required: true, default: 'image' },
    width: { type: Number },
    height: { type: Number },
    category: { type: String, default: '', trim: true },
    subcategory: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    secondaryColors: { type: [String], default: [] },
    pattern: { type: String, default: '', trim: true },
    material: { type: String, default: '', trim: true },
    season: { type: String, default: '', trim: true },
    occasions: { type: [String], default: [] },
    styleTags: { type: [String], default: [] },
    brand: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true, maxlength: 1000 },
  },
  { timestamps: true },
)

clothingItemSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('ClothingItem', clothingItemSchema)