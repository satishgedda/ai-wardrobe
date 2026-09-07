const crypto = require('crypto')

function requestContext(req, res, next) {
  req.requestId = crypto.randomUUID()
  res.setHeader('X-Request-Id', req.requestId)
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6
    console.info(JSON.stringify({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    }))
  })
  next()
}

module.exports = { requestContext }