import api from './api'

export const logSession        = (data) => api.post('/progress', data)
export const getProgress       = (params) => api.get('/progress', { params })
export const getReadinessHistory = ()    => api.get('/progress/readiness-history')
