const env = require('../config/env')

const isProduction = env.nodeEnv === 'production'

function getCookieAttributes() {
  return [
    'Path=/',
    'HttpOnly',
    isProduction ? 'SameSite=None' : 'SameSite=Lax',
    ...(isProduction ? ['Secure'] : []),
  ]
}

function setAuthCookie(res, token) {
  const attributes = [
    `accessToken=${encodeURIComponent(token)}`,
    'Max-Age=604800',
    ...getCookieAttributes(),
  ]

  res.setHeader('Set-Cookie', attributes.join('; '))
}

function clearAuthCookie(res) {
  const attributes = [
    'accessToken=',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ...getCookieAttributes(),
  ]

  res.setHeader('Set-Cookie', attributes.join('; '))
}

function getCookie(request, name) {
  const cookies =
    request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim()) || []

  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`))

  return match
    ? decodeURIComponent(match.slice(name.length + 1))
    : null
}

module.exports = {
  setAuthCookie,
  clearAuthCookie,
  getCookie,
}