const env = require('../config/env')

function setAuthCookie(res, token) {
  const attributes = [
    `accessToken=${encodeURIComponent(token)}`,
    'Max-Age=604800',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (env.nodeEnv === 'production') attributes.push('Secure')
  res.setHeader('Set-Cookie', attributes.join('; '))
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'accessToken=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax')
}

function getCookie(request, name) {
  const cookies = request.headers.cookie?.split(';').map((cookie) => cookie.trim()) || []
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

module.exports = { setAuthCookie, clearAuthCookie, getCookie }