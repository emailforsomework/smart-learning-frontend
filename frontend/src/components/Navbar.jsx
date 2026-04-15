import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        📚 <span>StudyPlanner</span>
      </NavLink>

      <div className="navbar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive?' active':''}`}>Dashboard</NavLink>
        <NavLink to="/generate"  className={({ isActive }) => `nav-link${isActive?' active':''}`}>New Plan</NavLink>
        <NavLink to="/progress"  className={({ isActive }) => `nav-link${isActive?' active':''}`}>Progress</NavLink>
        <NavLink to="/pomodoro"  className={({ isActive }) => `nav-link${isActive?' active':''}`}>🍅 Timer</NavLink>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        {user && (
          <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>
            👤 {user.name}
            {user.currentStreak > 0 && (
              <span style={{ marginLeft:'0.5rem', color:'var(--warning)' }}>🔥 {user.currentStreak}</span>
            )}
          </div>
        )}
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
