import { create } from 'zustand'
import { deleteWardrobeItem, fetchWardrobeItems, updateWardrobeItem, uploadWardrobeImage } from '../lib/wardrobe-api'

export const useWardrobeStore = create((set) => ({
  items: [],
  isLoading: false,
  error: null,
  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await fetchWardrobeItems()
      set({ items, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'We could not load your wardrobe. Please try again.' })
      throw new Error('Wardrobe loading failed')
    }
  },
  uploadItem: async (file, onProgress) => {
    const item = await uploadWardrobeImage(file, onProgress)
    set((state) => ({ items: [item, ...state.items] }))
    return item
  },
  deleteItem: async (itemId) => {
    await deleteWardrobeItem(itemId)
    set((state) => ({ items: state.items.filter((item) => item._id !== itemId) }))
  },
  updateItem: async (itemId, payload) => {
    const item = await updateWardrobeItem(itemId, payload)
    set((state) => ({ items: state.items.map((currentItem) => currentItem._id === itemId ? item : currentItem) }))
    return item
  },
}))
