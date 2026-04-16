import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh cookie with every request
})

// ─── Token management ────────────────────────────────────────────────────────
let _accessToken = null
export const setAxiosToken = (token) => { _accessToken = token }

api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`
  return config
})

// ─── Auto-refresh on 401 ──────────────────────────────────────────────────────
let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const code = error.response?.data?.code

    if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      isRefreshing = true
      try {
        const res = await api.post('/auth/refresh')
        const newToken = res.data.accessToken

        // Update context token — imported via window event (decoupled from React)
        window.dispatchEvent(new CustomEvent('token:refreshed', { detail: newToken }))

        refreshQueue.forEach((q) => q.resolve(newToken))
        refreshQueue = []
        isRefreshing = false

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        refreshQueue.forEach((q) => q.reject(refreshErr))
        refreshQueue = []
        isRefreshing = false
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  }
)

export default api
