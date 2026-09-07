const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary')
const ApiError = require('../utils/api-error')

function assertConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Image storage is not configured.')
  }
}

function uploadImage(buffer, userId) {
  assertConfigured()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `ai-wardrobe/${userId}`, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result)),
    )
    uploadStream.end(buffer)
  })
}

async function deleteImage(publicId, resourceType = 'image') {
  if (!isCloudinaryConfigured() || !publicId) return
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

module.exports = { uploadImage, deleteImage }