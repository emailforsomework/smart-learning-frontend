import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { setAxiosToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Access token lives in memory — never localStorage (XSS prevention)
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true on first load during token refresh

  // On mount: try to restore session via httpOnly cookie refresh token
  useEffect(() => {
    const restore = async () => {
      try {
        const res = await api.post('/auth/refresh')
        setAccessToken(res.data.accessToken)
        setAxiosToken(res.data.accessToken)
        // Fetch user profile with new token
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${res.data.accessToken}` },
        })
        setUser(meRes.data.user)
      } catch {
        // No valid refresh token — user must log in
        setUser(null)
        setAccessToken(null)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    setAccessToken(res.data.accessToken)
    setAxiosToken(res.data.accessToken)
    setUser(res.data.user)
    return res.data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    setAccessToken(res.data.accessToken)
    setAxiosToken(res.data.accessToken)
    setUser(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setAccessToken(null)
    setAxiosToken(null)
    setUser(null)
  }, [])

  const value = { accessToken, setAccessToken, user, setUser, loading, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
