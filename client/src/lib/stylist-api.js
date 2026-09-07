import apiClient from './api-client'

export async function fetchStylistConversations() {
  const response = await apiClient.get('/stylist/conversations')
  return response.data.data.conversations
}

export async function createStylistConversation(title = '') {
  const response = await apiClient.post('/stylist/conversations', { title })
  return response.data.data.conversation
}

export async function fetchStylistConversation(conversationId) {
  const response = await apiClient.get(`/stylist/conversations/${conversationId}`)
  return response.data.data.conversation
}

export async function sendStylistMessage(conversationId, content) {
  const response = await apiClient.post(`/stylist/conversations/${conversationId}/messages`, { content })
  return response.data.data
}

export async function deleteStylistConversation(conversationId) {
  await apiClient.delete(`/stylist/conversations/${conversationId}`)
}