function success(data, message = 'Request successful') {
  return { success: true, message, data }
}

module.exports = { success }