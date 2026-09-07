import apiClient from './api-client'

export async function fetchWardrobeItems() {
  const response = await apiClient.get('/wardrobe/items')
  return response.data.data.items
}

export async function uploadWardrobeImage(file, onProgress) {
  const formData = new FormData()
  formData.append('image', file)
  const response = await apiClient.post('/wardrobe/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded * 100) / event.total))
    },
  })
  return response.data.data.item
}

export async function deleteWardrobeItem(itemId) {
  await apiClient.delete(`/wardrobe/items/${itemId}`)
}

export async function updateWardrobeItem(itemId, payload) {
  const response = await apiClient.patch(`/wardrobe/items/${itemId}`, payload)
  return response.data.data.item
}
