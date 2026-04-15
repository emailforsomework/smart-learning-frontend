import api from './api'

export const startPomodoro    = (data) => api.post('/pomodoro/start', data)
export const completePomodoro = (id)   => api.patch(`/pomodoro/${id}/complete`)
export const getActivePomodoro = ()    => api.get('/pomodoro/active')
