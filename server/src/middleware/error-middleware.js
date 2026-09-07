function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}`, details: {}, requestId: req.requestId },
  })
}

function errorHandler(error, req, res, next) {
  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be 10 MB or smaller.'
      : error.message || 'The uploaded file is invalid.'
    return res.status(400).json({ success: false, error: { code: 'INVALID_UPLOAD', message, details: {} } })
  }

  const statusCode = error.statusCode || 500
  const code = error.code || 'INTERNAL_SERVER_ERROR'
  const message = statusCode === 500 ? 'An unexpected server error occurred.' : error.message

  if (statusCode === 500) console.error(JSON.stringify({ requestId: req.requestId, message: error.message, stack: error.stack }))

  res.status(statusCode).json({ success: false, error: { code, message, details: error.details || {}, requestId: req.requestId } })
}

module.exports = { notFoundHandler, errorHandler }