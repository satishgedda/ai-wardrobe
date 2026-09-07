const env = require('../config/env')
const ApiError = require('../utils/api-error')

function isStylistConfigured() {
  return Boolean(env.gemini.apiKey)
}

function buildPrompt({ message, history, wardrobe, context }) {
  return `You are the AI Wardrobe personal stylist. Answer the user's request using only the wardrobe items listed below. Never invent an owned clothing item, item ID, outfit ID, brand, or attribute. You may suggest a category the user does not own, but clearly label it as a missing item. When mentioning wardrobe items, include their exact IDs in referencedClothingItemIds. Return strict JSON with: message (string), referencedClothingItemIds (array of exact provided IDs), referencedOutfitId (null), suggestedActions (array of short strings). Keep the answer concise and practical. Context: ${JSON.stringify(context || {})}. Wardrobe: ${JSON.stringify(wardrobe)}. Conversation: ${JSON.stringify(history)}. User message: ${message}`
}

async function generateStylistReply({ message, history, wardrobe, context }) {
  if (!isStylistConfigured()) throw new ApiError(503, 'STYLIST_NOT_CONFIGURED', 'AI stylist service is not configured.')

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent?key=${encodeURIComponent(env.gemini.apiKey)}`
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt({ message, history, wardrobe, context }) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.45 },
      }),
    })
  } catch (error) {
    throw new ApiError(502, 'STYLIST_UNAVAILABLE', 'AI stylist service is temporarily unavailable.')
  }

  if (!response.ok) throw new ApiError(502, 'STYLIST_PROVIDER_ERROR', 'AI stylist service returned an error.')
  const body = await response.json()
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new ApiError(502, 'STYLIST_INVALID_RESPONSE', 'AI stylist returned an invalid response.')
  }

  const wardrobeIds = new Set(wardrobe.map((item) => item.id))
  const referencedClothingItemIds = Array.isArray(parsed.referencedClothingItemIds)
    ? parsed.referencedClothingItemIds.filter((id) => wardrobeIds.has(id))
    : []
  if (typeof parsed.message !== 'string' || !parsed.message.trim()) {
    throw new ApiError(502, 'STYLIST_INVALID_RESPONSE', 'AI stylist returned an incomplete response.')
  }

  return {
    content: parsed.message.trim(),
    referencedClothingItemIds,
    referencedOutfitId: null,
    suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.filter((action) => typeof action === 'string').slice(0, 4) : [],
  }
}

module.exports = { generateStylistReply, isStylistConfigured }