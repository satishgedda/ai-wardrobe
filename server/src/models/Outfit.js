const mongoose = require('mongoose')

const outfitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    clothingItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClothingItem', required: true }],
    weatherContext: { type: mongoose.Schema.Types.Mixed, default: {} },
    stylingNotes: { type: String, default: '', maxlength: 2000 },
    aiExplanation: { type: String, default: '' },
    generatedBy: { type: String, enum: ['manual', 'ai', 'recommendation'], default: 'recommendation' },
    isSaved: { type: Boolean, default: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Outfit', outfitSchema)