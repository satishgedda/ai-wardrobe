const multer = require('multer')
const path = require('path')

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const clothingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const validExtension = (file.mimetype === 'image/jpeg' && ['.jpg', '.jpeg'].includes(extension))
      || (file.mimetype === 'image/png' && extension === '.png')
      || (file.mimetype === 'image/webp' && extension === '.webp')
    if (!allowedMimeTypes.has(file.mimetype) || !validExtension) {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE')
      error.message = 'Only JPG, JPEG, PNG, and WEBP images are supported.'
      return callback(error)
    }
    callback(null, true)
  },
})

module.exports = { clothingUpload }