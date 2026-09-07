const mongoose = require('mongoose')
const ApiError = require('../utils/api-error')
const Outfit = require('../models/Outfit')
const ClothingItem = require('../models/ClothingItem')
const { getOutfitRecommendation } = require('../services/outfit-recommendation-service')
const { success } = require('../utils/api-response')

async function recommendOutfit(req, res, next) {
  try {
    const recommendation = await getOutfitRecommendation(req.user.id, req.body.city || req.user.location, req.body.variation || 1)
    res.json(success(recommendation))
  } catch (error) {
    next(error)
  }
}

async function saveOutfit(req, res, next) {
  try {
    const { clothingItemIds, name, weatherContext, stylingNotes, aiExplanation } = req.body
    if (!Array.isArray(clothingItemIds) || !clothingItemIds.length || clothingItemIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw new ApiError(400, 'INVALID_OUTFIT_ITEMS', 'Choose clothing items from your wardrobe before saving.')
    }
    const items = await ClothingItem.find({ _id: { $in: clothingItemIds }, user: req.user.id })
    if (items.length !== new Set(clothingItemIds).size) throw new ApiError(400, 'INVALID_OUTFIT_ITEMS', 'Only your wardrobe items can be saved to an outfit.')

    const outfit = await Outfit.create({
      user: req.user.id,
      clothingItemIds,
      name: name || 'Today\'s outfit',
      weatherContext,
      stylingNotes: stylingNotes || '',
      aiExplanation: aiExplanation || '',
      generatedBy: 'recommendation',
      isSaved: true,
    })
    res.status(201).json(success({ outfit }, 'Outfit saved'))
  } catch (error) {
    next(error)
  }
}

module.exports = { recommendOutfit, saveOutfit }