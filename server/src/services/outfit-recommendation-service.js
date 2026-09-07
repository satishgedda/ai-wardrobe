const ClothingItem = require('../models/ClothingItem')
const User = require('../models/User')
const { getWeather } = require('./weather-service')
const { refineRecommendation } = require('./gemini-service')

const categoryAliases = {
  top: ['top', 'shirt', 'blouse', 'sweater', 'sweatshirt', 't-shirt', 'tee'],
  bottom: ['bottom', 'trouser', 'pant', 'jean', 'skirt', 'short'],
  shoes: ['shoe', 'sneaker', 'boot', 'heel', 'loafer', 'footwear'],
  outerwear: ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear', 'parka'],
  accessory: ['accessory', 'accessories', 'bag', 'belt', 'scarf', 'hat', 'jewelry', 'watch'],
  dress: ['dress', 'jumpsuit', 'romper'],
}

function matchesCategory(item, category) {
  const value = `${item.category} ${item.subcategory}`.toLowerCase()
  return categoryAliases[category].some((alias) => value.includes(alias))
}

function getItemId(item) {
  return item._id.toString()
}

function scoreItem(item, weather, variation, preferences = {}) {
  let score = 0
  const value = `${item.season} ${(item.styleTags || []).join(' ')}`.toLowerCase()
  if (weather.current.temperature < 12 && /winter|warm|cold/.test(value)) score += 3
  if (weather.current.temperature > 24 && /summer|light|linen/.test(value)) score += 3
  if (weather.current.precipitation > 0 && /waterproof|rain|coat/.test(value)) score += 3
  const preferredColors = (preferences.favoriteColors || []).map((color) => color.toLowerCase())
  const preferredStyle = (preferences.style || '').toLowerCase()
  if (preferredColors.some((color) => `${item.color} ${(item.secondaryColors || []).join(' ')}`.toLowerCase().includes(color))) score += 2
  if (preferredStyle && value.includes(preferredStyle)) score += 2
  score += item.color ? 1 : 0
  return score + (variation % 3 === 0 ? 0 : (item._id.toString().charCodeAt(0) % variation))
}

function chooseItem(items, category, weather, variation, excludedIds = new Set(), preferences = {}) {
  return items.filter((item) => matchesCategory(item, category) && !excludedIds.has(getItemId(item)))
    .sort((left, right) => scoreItem(right, weather, variation, preferences) - scoreItem(left, weather, variation, preferences))[0]
}

function addItem(item, selected, selectedIds) {
  if (!item) return
  selected.push(item)
  selectedIds.add(getItemId(item))
}

function buildDeterministicRecommendation(items, weather, variation = 1, preferences = {}) {
  const selected = []
  const selectedIds = new Set()
  const needsOuterwear = weather.current.temperature < 18 || weather.current.precipitation > 0 || /rain|snow|storm/.test(weather.current.conditionGroup.toLowerCase())
  const top = chooseItem(items, 'top', weather, variation, selectedIds, preferences)
  const bottom = chooseItem(items, 'bottom', weather, variation, selectedIds, preferences)
  const dress = chooseItem(items, 'dress', weather, variation, selectedIds, preferences)

  if (top && bottom) {
    addItem(top, selected, selectedIds)
    addItem(chooseItem(items, 'bottom', weather, variation, selectedIds, preferences), selected, selectedIds)
  } else if (dress) {
    addItem(dress, selected, selectedIds)
  } else {
    addItem(top, selected, selectedIds)
    addItem(bottom, selected, selectedIds)
  }

  addItem(chooseItem(items, 'shoes', weather, variation, selectedIds, preferences), selected, selectedIds)
  if (needsOuterwear) {
    addItem(chooseItem(items, 'outerwear', weather, variation, selectedIds, preferences), selected, selectedIds)
  }
  addItem(chooseItem(items, 'accessory', weather, variation, selectedIds, preferences), selected, selectedIds)

  if (!selected.length && items.length) {
    const fallback = [...items].sort((left, right) => scoreItem(right, weather, variation, preferences) - scoreItem(left, weather, variation, preferences))[0]
    addItem(fallback, selected, selectedIds)
  }

  const missingCategories = []
  if (!selected.some((item) => matchesCategory(item, 'shoes')) && selected.length) missingCategories.push('shoes')
  if (needsOuterwear && !selected.some((item) => matchesCategory(item, 'outerwear'))) missingCategories.push('weather-appropriate outerwear')
  const selectedItemIds = selected.map(getItemId)
  const reason = selected.length
    ? `This edit uses the most suitable pieces currently in your wardrobe for today's conditions.${missingCategories.length ? ` ${missingCategories.join(' and ')} would be an optional addition.` : ''}`
    : 'Add any wardrobe piece to begin receiving weather-aware styling suggestions.'

  return {
    selectedItemIds,
    alternativeItemIds: [],
    missingCategories,
    reason,
    styleDescription: selected.length ? 'A considered weather-aware look built from your existing pieces.' : 'Add any wardrobe piece to begin building outfits.',
    source: 'wardrobe-rules',
  }
}

async function getOutfitRecommendation(userId, city, variation = 1) {
  const [weather, items, user] = await Promise.all([
    getWeather(city),
    ClothingItem.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    User.findById(userId).select('preferences').lean(),
  ])
  const preferences = user?.preferences || {}
  const candidates = items.map((item) => ({
    id: item._id.toString(),
    category: item.category,
    subcategory: item.subcategory,
    color: item.color,
    season: item.season,
    occasions: item.occasions,
    styleTags: item.styleTags,
  }))
  const deterministicRecommendation = buildDeterministicRecommendation(items, weather, Number(variation) || 1, preferences)
  const refined = await refineRecommendation(candidates, weather, deterministicRecommendation)
  const selectedIds = new Set(refined.recommendation.selectedItemIds)
  const selectedItems = items.filter((item) => selectedIds.has(item._id.toString()))
  const alternativeIds = new Set(refined.recommendation.alternativeItemIds)
  const alternativeItems = items.filter((item) => alternativeIds.has(item._id.toString()))

  return {
    weather,
    recommendation: { ...refined.recommendation, items: selectedItems, alternativeItems },
    ai: { configured: refined.configured, fallback: Boolean(refined.fallback) },
  }
}

module.exports = { getOutfitRecommendation }
