import { create } from 'zustand'
import apiClient from '../lib/api-client'

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, error: null }),
  restoreSession: async () => {
    try {
      const response = await apiClient.get('/auth/me')
      set({ user: response.data.data.user, isLoading: false, error: null })
    } catch {
      set({ user: null, isLoading: false, error: null })
    }
  },
  register: async (payload) => {
    const response = await apiClient.post('/auth/register', payload)
    set({ user: response.data.data.user, error: null })
    return response.data.data.user
  },
  login: async (payload) => {
    const response = await apiClient.post('/auth/login', payload)
    set({ user: response.data.data.user, error: null })
    return response.data.data.user
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      set({ user: null, error: null })
    }
  },
}))