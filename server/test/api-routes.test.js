const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-only-jwt-secret-that-is-at-least-32-characters'
process.env.MONGODB_URI = ''

const users = []
const items = [
  { _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011', user: '000000000000000000000001', category: 'shirt', color: 'blue', imageUrl: 'https://example.test/alice.jpg', cloudinaryPublicId: 'alice-image' },
  { _id: '507f1f77bcf86cd799439012', id: '507f1f77bcf86cd799439012', user: '000000000000000000000002', category: 'jeans', color: 'black', imageUrl: 'https://example.test/bob.jpg', cloudinaryPublicId: 'bob-image' },
  { _id: '507f1f77bcf86cd799439013', id: '507f1f77bcf86cd799439013', user: '000000000000000000000001', category: 'shoes', color: 'white', imageUrl: 'https://example.test/alice-shoes.jpg', cloudinaryPublicId: 'alice-shoes' },
]
const outfits = []

function installMock(modulePath, exports) {
  const resolved = require.resolve(modulePath)
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}

function makeUser(data) {
  const id = (users.length + 1).toString(16).padStart(24, '0')
  return { _id: id, id, ...data, async comparePassword(password) { return password === this.password }, toSafeObject() { return { _id: this._id, id: this.id, name: this.name, email: this.email, location: '', preferences: {} } } }
}

function query(foundItems) {
  const promise = Promise.resolve(foundItems)
  promise.sort = () => ({ lean: async () => foundItems })
  promise.lean = async () => foundItems
  return promise
}

installMock('../src/models/User', {
  findOne({ email }) {
    const user = users.find((candidate) => candidate.email === email) || null
    return { select: () => user, then: (resolve) => Promise.resolve(resolve(user)) }
  },
  async create(data) { const user = makeUser(data); users.push(user); return user },
  async findById(id) { return users.find((user) => user.id === id) || null },
})
installMock('../src/models/ClothingItem', {
  find(filter) {
    return query(items.filter((item) => item.user === filter.user && (!filter._id?.$in || filter._id.$in.includes(item._id))))
  },
  findOne({ _id, user }) { return { lean: async () => items.find((item) => item._id === _id && item.user === user) || null } },
  async findOneAndUpdate({ _id, user }, updates) { const item = items.find((candidate) => candidate._id === _id && candidate.user === user); return item && Object.assign(item, updates) },
  async findOneAndDelete({ _id, user }) { const index = items.findIndex((item) => item._id === _id && item.user === user); return index < 0 ? null : items.splice(index, 1)[0] },
})
installMock('../src/models/Outfit', { async create(data) { const outfit = { _id: `outfit-${outfits.length + 1}`, ...data }; outfits.push(outfit); return outfit }, find() { return { populate: () => ({ sort: () => ({ lean: async () => [] }) }) } } })
installMock('../src/services/cloudinary-service', { uploadImage: async () => { throw new Error('upload should not run') }, deleteImage: async () => {} })
installMock('../src/services/outfit-recommendation-service', { async getOutfitRecommendation() { return { weather: { location: 'Test City' }, recommendation: { items: [] }, ai: { configured: false } } } })

const app = require('../src/app')
let server
let baseUrl
before(async () => { server = app.listen(0); await new Promise((resolve) => server.once('listening', resolve)); baseUrl = `http://127.0.0.1:${server.address().port}` })
after(async () => new Promise((resolve) => server.close(resolve)))

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  return { response, body: await response.json() }
}
async function login() {
  const result = await request('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alice@example.test', password: 'ValidPass123' }) })
  return result.response.headers.get('set-cookie').split(';')[0]
}

test('protected routes reject unauthenticated requests', async () => {
  const result = await request('/api/v1/wardrobe/items')
  assert.equal(result.response.status, 401)
  assert.equal(result.body.error.code, 'AUTHENTICATION_REQUIRED')
})

test('registration creates a session and rejects a duplicate email', async () => {
  const payload = { name: 'Test User', email: 'alice@example.test', password: 'ValidPass123' }
  const first = await request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  assert.equal(first.response.status, 201)
  assert.match(first.response.headers.get('set-cookie'), /^accessToken=/)
  assert.equal(first.body.data.user.password, undefined)
  const duplicate = await request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  assert.equal(duplicate.response.status, 409)
})

test('login rejects invalid credentials and validates a returned session', async () => {
  const invalid = await request('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alice@example.test', password: 'WrongPass123' }) })
  assert.equal(invalid.response.status, 401)
  const cookie = await login()
  const session = await request('/api/v1/auth/me', { headers: { Cookie: cookie } })
  assert.equal(session.response.status, 200)
  assert.equal(session.body.data.user.email, 'alice@example.test')
})

test('wardrobe validates uploads and scopes list/get/update/delete to the owner', async () => {
  const cookie = await login()
  const headers = { Cookie: cookie, 'Content-Type': 'application/json' }
  const missingImage = await request('/api/v1/wardrobe/items', { method: 'POST', headers: { Cookie: cookie } })
  assert.equal(missingImage.response.status, 400)
  assert.equal(missingImage.body.error.code, 'IMAGE_REQUIRED')
  const list = await request('/api/v1/wardrobe/items', { headers })
  assert.deepEqual(list.body.data.items.map((item) => item._id), ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013'])
  const other = await request('/api/v1/wardrobe/items/507f1f77bcf86cd799439012', { headers })
  assert.equal(other.response.status, 404)
  const update = await request('/api/v1/wardrobe/items/507f1f77bcf86cd799439011', { method: 'PATCH', headers, body: JSON.stringify({ category: 't-shirt' }) })
  assert.equal(update.response.status, 200)
  assert.equal(update.body.data.item.category, 't-shirt')
  const deleted = await request('/api/v1/wardrobe/items/507f1f77bcf86cd799439011', { method: 'DELETE', headers })
  assert.equal(deleted.response.status, 200)
})

test('weather rejects incomplete coordinates before contacting a provider', async () => {
  const result = await request('/api/v1/weather?lat=10', { headers: { Cookie: await login() } })
  assert.equal(result.response.status, 400)
  assert.equal(result.body.error.code, 'INVALID_COORDINATES')
})

test('recommendations are provider-stubbed and saved outfits require owned items', async () => {
  const headers = { Cookie: await login(), 'Content-Type': 'application/json' }
  const recommendation = await request('/api/v1/recommendations/outfit', { method: 'POST', headers, body: JSON.stringify({ city: 'Test City' }) })
  assert.equal(recommendation.response.status, 200)
  const invalid = await request('/api/v1/recommendations/outfit/save', { method: 'POST', headers, body: JSON.stringify({ clothingItemIds: ['507f1f77bcf86cd799439012'] }) })
  assert.equal(invalid.response.status, 400)
  const saved = await request('/api/v1/recommendations/outfit/save', { method: 'POST', headers, body: JSON.stringify({ clothingItemIds: ['507f1f77bcf86cd799439013'] }) })
  assert.equal(saved.response.status, 201)
  assert.equal(outfits.length, 1)
})
