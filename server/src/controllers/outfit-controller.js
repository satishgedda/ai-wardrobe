const mongoose = require('mongoose')
const ApiError = require('../utils/api-error')
const Outfit = require('../models/Outfit')
const { success } = require('../utils/api-response')

function ensureValidId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_OUTFIT_ID', 'The outfit ID is invalid.')
}

async function listSavedOutfits(req, res, next) {
  try {
    const outfits = await Outfit.find({ user: req.user.id, isSaved: true })
      .populate('clothingItemIds', 'imageUrl category color season styleTags')
      .sort({ createdAt: -1 })
      .lean()
    res.json(success({ outfits, count: outfits.length }))
  } catch (error) {
    next(error)
  }
}

async function unsaveOutfit(req, res, next) {
  try {
    ensureValidId(req.params.id)
    const outfit = await Outfit.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isSaved: false },
      { returnDocument: 'after' },
    )
    if (!outfit) throw new ApiError(404, 'OUTFIT_NOT_FOUND', 'That saved outfit could not be found.')
    res.json(success({ id: outfit.id }, 'Outfit removed from saved outfits'))
  } catch (error) {
    next(error)
  }
}

async function deleteOutfit(req, res, next) {
  try {
    ensureValidId(req.params.id)
    const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!outfit) throw new ApiError(404, 'OUTFIT_NOT_FOUND', 'That outfit could not be found.')
    res.json(success({ id: outfit.id }, 'Outfit deleted'))
  } catch (error) {
    next(error)
  }
}

module.exports = { listSavedOutfits, unsaveOutfit, deleteOutfit }