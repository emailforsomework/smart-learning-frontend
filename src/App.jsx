import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PlanGeneratorPage from './pages/PlanGeneratorPage'
import ProgressPage from './pages/ProgressPage'
import PomodoroPage from './pages/PomodoroPage'

function AppInner() {
  const { accessToken, setAccessToken, logout, loading } = useAuth()


  // Listen for token refresh events from the Axios interceptor
  useEffect(() => {
    const onRefreshed = (e) => setAccessToken(e.detail)
    const onLogout    = ()  => logout()
    window.addEventListener('token:refreshed', onRefreshed)
    window.addEventListener('auth:logout', onLogout)
    return () => {
      window.removeEventListener('token:refreshed', onRefreshed)
      window.removeEventListener('auth:logout', onLogout)
    }
  }, [setAccessToken, logout])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem' }}>
        <div className="spinner" style={{width:40,height:40,borderWidth:3}} />
        <p style={{color:'var(--text-muted)'}}>Restoring session…</p>
      </div>
    )
  }

  if (!accessToken) return <AuthPage />

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<DashboardPage />} />
        <Route path="/generate"  element={<PlanGeneratorPage />} />
        <Route path="/progress"  element={<ProgressPage />} />
        <Route path="/pomodoro"  element={<PomodoroPage />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div style={{ position:'relative', zIndex:1 }}>
          <AppInner />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
