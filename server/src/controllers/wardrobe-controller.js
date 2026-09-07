const mongoose = require('mongoose')
const ClothingItem = require('../models/ClothingItem')
const ApiError = require('../utils/api-error')
const { uploadImage, deleteImage } = require('../services/cloudinary-service')
const {
  extractClothingMetadata,
  normalizeClothingMetadata,
  clothingCategories,
} = require('../services/gemini-service')
const { success } = require('../utils/api-response')

const wardrobeCategories = clothingCategories

function ensureValidId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ITEM_ID', 'The clothing item ID is invalid.')
}

async function createItem(req, res, next) {
  let cloudinaryAsset
  try {
    if (!req.file) throw new ApiError(400, 'IMAGE_REQUIRED', 'Select an image to upload.')

    cloudinaryAsset = await uploadImage(req.file.buffer, req.user.id)
    const metadata = await extractClothingMetadata(req.file)
    const item = await ClothingItem.create({
      user: req.user.id,
      imageUrl: cloudinaryAsset.secure_url,
      cloudinaryPublicId: cloudinaryAsset.public_id,
      resourceType: cloudinaryAsset.resource_type || 'image',
      width: cloudinaryAsset.width,
      height: cloudinaryAsset.height,
      ...(metadata || {}),
    })

    res.status(201).json(success({ item }, 'Clothing item uploaded'))
  } catch (error) {
    if (cloudinaryAsset?.public_id) {
      try {
        await deleteImage(cloudinaryAsset.public_id, cloudinaryAsset.resource_type)
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed', cleanupError)
      }
    }
    next(error)
  }
}

async function listItems(req, res, next) {
  try {
    const items = await ClothingItem.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()
    res.json(success({ items, count: items.length }))
  } catch (error) {
    next(error)
  }
}

async function getItem(req, res, next) {
  try {
    ensureValidId(req.params.id)
    const item = await ClothingItem.findOne({ _id: req.params.id, user: req.user.id }).lean()
    if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'That clothing item could not be found.')
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

async function updateItem(req, res, next) {
  try {
    ensureValidId(req.params.id)
    const allowedFields = new Set(['category', 'color', 'season', 'occasions', 'styleTags', 'material'])
    const requestedFields = Object.keys(req.body || {})
    if (!requestedFields.length || requestedFields.some((field) => !allowedFields.has(field))) {
      throw new ApiError(400, 'INVALID_METADATA', 'Only supported clothing metadata can be updated.')
    }
    const normalized = normalizeClothingMetadata(req.body)
    const arrayFields = new Set(['occasions', 'styleTags'])
    const updates = {}
    for (const field of requestedFields) {
      const value = req.body[field]
      if (arrayFields.has(field)) {
        if (!Array.isArray(value) || (value.length && (!normalized[field] || normalized[field].length !== value.length))) {
          throw new ApiError(400, 'INVALID_METADATA', 'Choose valid values for all clothing metadata.')
        }
        updates[field] = normalized[field] || []
      } else if (value === '') {
        updates[field] = ''
      } else if (!Object.hasOwn(normalized, field)) {
        throw new ApiError(400, 'INVALID_METADATA', 'Choose valid values for all clothing metadata.')
      } else {
        updates[field] = normalized[field]
      }
    }

    const item = await ClothingItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { returnDocument: 'after', runValidators: true },
    )
    if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'That clothing item could not be found.')
    res.json(success({ item }, 'Clothing item updated'))
  } catch (error) {
    next(error)
  }
}

async function deleteItem(req, res, next) {
  try {
    ensureValidId(req.params.id)
    const item = await ClothingItem.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'That clothing item could not be found.')

    try {
      await deleteImage(item.cloudinaryPublicId, item.resourceType)
    } catch (cleanupError) {
      console.error('Cloudinary cleanup failed', cleanupError)
      throw new ApiError(502, 'IMAGE_CLEANUP_FAILED', 'The clothing item was removed, but its image cleanup failed.')
    }

    res.json(success({ id: item.id }, 'Clothing item deleted'))
  } catch (error) {
    next(error)
  }
}

module.exports = { createItem, listItems, getItem, updateItem, deleteItem }
