const env = require('../config/env')

// These values are intentionally shared by automatic classification and the
// manual editor. Gemini output is always normalized against this allow-list.
const clothingCategories = new Set([
  'top', 'bottom', 'outerwear', 'accessory', 'dress',
  't-shirt', 'shirt', 'jeans', 'trousers', 'pants', 'shorts',
  'jacket', 'hoodie', 'sweater', 'skirt', 'shoes', 'accessories', 'other',
])
const clothingColors = new Set(['black', 'white', 'gray', 'blue', 'navy', 'red', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'beige', 'cream', 'khaki', 'multicolor'])
const clothingSeasons = new Set(['spring', 'summer', 'autumn', 'winter', 'all-season'])
const clothingOccasions = new Set(['casual', 'formal', 'business', 'party', 'active', 'travel'])
const clothingStyles = new Set(['casual', 'formal', 'business', 'sporty', 'streetwear', 'minimalist', 'classic', 'bohemian', 'elegant'])
const clothingMaterials = new Set(['cotton', 'denim', 'linen', 'wool', 'leather', 'synthetic', 'silk', 'knit'])

function isGeminiConfigured() {
  return Boolean(env.gemini.apiKey)
}

function normalizeCategory(value) {
  if (typeof value !== 'string') return ''
  const category = value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')
  return clothingCategories.has(category) ? category : ''
}

function normalizeOption(value, allowedValues, aliases = {}) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')
  const valueToCheck = aliases[normalized] || normalized
  return allowedValues.has(valueToCheck) ? valueToCheck : ''
}

function normalizeOptions(values, allowedValues) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map((value) => normalizeOption(value, allowedValues)).filter(Boolean))]
}

function normalizeClothingMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const category = normalizeCategory(value.category)
  const color = normalizeOption(value.color, clothingColors, { grey: 'gray' })
  const season = normalizeOption(value.season, clothingSeasons)
  const material = normalizeOption(value.material, clothingMaterials)
  const occasions = normalizeOptions(value.occasions, clothingOccasions)
  const styleTags = normalizeOptions(value.styleTags, clothingStyles)
  return {
    ...(category ? { category } : {}),
    ...(color ? { color } : {}),
    ...(season ? { season } : {}),
    ...(material ? { material } : {}),
    ...(occasions.length ? { occasions } : {}),
    ...(styleTags.length ? { styleTags } : {}),
  }
}

async function extractClothingMetadata(file) {
  if (!isGeminiConfigured() || !file?.buffer || !file.mimetype) return null

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent?key=${encodeURIComponent(env.gemini.apiKey)}`
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Analyze this clothing image. Return JSON only with category, color, season, material, occasions (array), and styleTags (array). Allowed categories: t-shirt, shirt, jeans, trousers, pants, shorts, jacket, hoodie, sweater, dress, skirt, shoes, accessories, other. Allowed colors: black, white, gray, blue, navy, red, green, yellow, orange, purple, pink, brown, beige, cream, khaki, multicolor. Allowed seasons: spring, summer, autumn, winter, all-season. Allowed materials: cotton, denim, linen, wool, leather, synthetic, silk, knit. Allowed occasions: casual, formal, business, party, active, travel. Allowed style tags: casual, formal, business, sporty, streetwear, minimalist, classic, bohemian, elegant. Omit fields when uncertain; never invent values.' },
          { inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } },
        ] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    })
    if (!response.ok) throw new Error(`Gemini classification request failed (${response.status})`)
    const body = await response.json()
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = JSON.parse(text)
    return normalizeClothingMetadata(parsed)
  } catch (error) {
    // Classification is a best-effort enhancement; the upload remains usable
    // when Gemini is unavailable, misconfigured, or returns malformed output.
    console.warn('Gemini clothing classification unavailable', error.message)
    return null
  }
}

async function classifyClothingImage(file) {
  const metadata = await extractClothingMetadata(file)
  return metadata?.category || null
}

async function refineRecommendation(candidates, weather, deterministicRecommendation) {
  if (!isGeminiConfigured()) return { recommendation: deterministicRecommendation, configured: false }

  const prompt = `You are a wardrobe stylist. Use ONLY the provided wardrobe items. Return JSON with selectedItemIds (array), reason (string), styleDescription (string), and alternativeItemIds (array). Every ID must be copied exactly from the provided items. Create the best possible weather-aware outfit from any non-empty wardrobe: prefer a complete look when possible, but never require particular categories or omit useful available items because a category is missing. Never invent items. Weather: ${JSON.stringify(weather)}. Wardrobe: ${JSON.stringify(candidates)}`
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent?key=${encodeURIComponent(env.gemini.apiKey)}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    })
    if (!response.ok) throw new Error('Gemini request failed')
    const body = await response.json()
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = JSON.parse(text)
    const candidateIds = new Set(candidates.map((item) => item.id))
    const selectedItemIds = (parsed.selectedItemIds || []).filter((id) => candidateIds.has(id))
    const alternativeItemIds = (parsed.alternativeItemIds || []).filter((id) => candidateIds.has(id))
    const deterministicIds = new Set(deterministicRecommendation.selectedItemIds)
    if (!selectedItemIds.length || [...deterministicIds].some((id) => !selectedItemIds.includes(id))) {
      throw new Error('Gemini returned an incomplete wardrobe selection')
    }

    return {
      configured: true,
      recommendation: {
        ...deterministicRecommendation,
        selectedItemIds,
        alternativeItemIds,
        reason: parsed.reason || deterministicRecommendation.reason,
        styleDescription: parsed.styleDescription || deterministicRecommendation.styleDescription,
        source: 'gemini',
      },
    }
  } catch (error) {
    console.error('Gemini recommendation fallback', error)
    return { recommendation: deterministicRecommendation, configured: true, fallback: true }
  }
}

module.exports = {
  refineRecommendation,
  isGeminiConfigured,
  classifyClothingImage,
  extractClothingMetadata,
  normalizeClothingMetadata,
  clothingCategories,
  clothingColors,
  clothingSeasons,
  clothingOccasions,
  clothingStyles,
  clothingMaterials,
}
