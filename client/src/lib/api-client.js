import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export function getApiError(error, fallback = 'Something went wrong.') {
  return error.response?.data?.error?.message || fallback
}

export default apiClient