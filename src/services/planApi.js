import api from './api'

export const getActivePlan  = ()           => api.get('/plans/active')
export const createPlan     = (data)       => api.post('/plans', data)
export const getPlanById    = (id)         => api.get(`/plans/${id}`)
export const archivePlan    = (id)         => api.post(`/plans/${id}/archive`)
export const updateSettings = (id, data)   => api.patch(`/plans/${id}`, data)
export const getReadiness   = ()           => api.get('/plans/readiness')

export const updateTopic = (planId, topicId, data) =>
  api.patch(`/plans/${planId}/topics/${topicId}`, data)

export const reschedulePlan = (planId) =>
  api.post(`/plans/${planId}/reschedule`)
