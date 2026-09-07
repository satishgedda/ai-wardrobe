import { create } from 'zustand'
import { createStylistConversation, deleteStylistConversation, fetchStylistConversation, fetchStylistConversations, sendStylistMessage } from '../lib/stylist-api'

export const useStylistStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  isLoading: false,
  isSending: false,
  error: null,
  loadConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const conversations = await fetchStylistConversations()
      set({ conversations, isLoading: false })
      return conversations
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'We could not load your styling conversations.' })
      throw error
    }
  },
  openConversation: async (conversationId) => {
    set({ isLoading: true, error: null })
    try {
      const activeConversation = await fetchStylistConversation(conversationId)
      set({ activeConversation, isLoading: false })
      return activeConversation
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'We could not open that conversation.' })
      throw error
    }
  },
  newConversation: async () => {
    const activeConversation = await createStylistConversation()
    set((state) => ({ activeConversation, conversations: [activeConversation, ...state.conversations], error: null }))
    return activeConversation
  },
  sendMessage: async (content) => {
    const conversationId = get().activeConversation?._id
    if (!conversationId) throw new Error('No active conversation')
    set({ isSending: true, error: null })
    try {
      const response = await sendStylistMessage(conversationId, content)
      set((state) => ({ activeConversation: response.conversation, conversations: state.conversations.map((conversation) => conversation._id === conversationId ? { ...conversation, title: response.conversation.title, lastMessageAt: response.conversation.lastMessageAt } : conversation), isSending: false }))
      return response.message
    } catch (error) {
      set({ isSending: false, error: error.response?.data?.error?.message || 'The stylist could not answer right now.' })
      throw error
    }
  },
  deleteConversation: async (conversationId) => {
    await deleteStylistConversation(conversationId)
    set((state) => ({ conversations: state.conversations.filter((conversation) => conversation._id !== conversationId), activeConversation: state.activeConversation?._id === conversationId ? null : state.activeConversation }))
  },
}))