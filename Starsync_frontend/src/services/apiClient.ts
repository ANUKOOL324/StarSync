import axios from 'axios'

const DEFAULT_API_URL = 'http://localhost:3001/api/v1'

const normalizeApiBaseUrl = (url: string) => {
  const trimmedUrl = url.replace(/\/+$/, '')

  if (trimmedUrl === '/api') {
    return '/api/v1'
  }

  return trimmedUrl
}

export const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL ?? DEFAULT_API_URL),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})
