function createRateLimiter({ windowMs, max, code = 'RATE_LIMITED', message = 'Too many requests. Please try again later.' }) {
  const requests = new Map()
  const cleanup = setInterval(() => {
    const cutoff = Date.now() - windowMs
    for (const [key, timestamps] of requests) {
      const recent = timestamps.filter((timestamp) => timestamp > cutoff)
      if (recent.length) requests.set(key, recent)
      else requests.delete(key)
    }
  }, windowMs).unref()

  return (req, res, next) => {
    const key = `${req.ip}:${req.method}:${req.path}`
    const now = Date.now()
    const recent = (requests.get(key) || []).filter((timestamp) => timestamp > now - windowMs)
    recent.push(now)
    requests.set(key, recent)
    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recent.length))

    if (recent.length > max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000))
      return res.status(429).json({ success: false, error: { code, message, details: {} } })
    }
    next()
  }
}

const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300 })
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' })
const aiRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30, code: 'AI_RATE_LIMITED', message: 'Too many AI requests. Please try again shortly.' })

module.exports = { apiRateLimiter, authRateLimiter, aiRateLimiter }