function validateMessage(content) {
  if (typeof content !== 'string' || !content.trim()) return 'Write a message first.'
  if (content.trim().length > 2000) return 'Messages must be 2,000 characters or fewer.'
  return null
}

module.exports = { validateMessage }