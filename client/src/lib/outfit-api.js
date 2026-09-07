import apiClient from './api-client'

export async function fetchSavedOutfits() {
  const response = await apiClient.get('/outfits')
  return response.data.data.outfits
}

export async function unsaveOutfit(outfitId) {
  await apiClient.patch(`/outfits/${outfitId}/save`)
}

export async function deleteOutfit(outfitId) {
  await apiClient.delete(`/outfits/${outfitId}`)
}
