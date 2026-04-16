import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const [tab, setTab]       = useState('login')
  const [form, setForm]     = useState({ name:'', email:'', password:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'login') await login(form.email, form.password)
      else                 await register(form.name, form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:440 }} className="animate-in">

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>📚</div>
          <h1 style={{ fontSize:'1.8rem', marginBottom:'0.25rem' }}>
            Smart <span className="gradient-text">Study Planner</span>
          </h1>
          <p style={{ fontSize:'0.9rem' }}>AI-powered, algorithm-driven study schedules</p>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom:'1.75rem' }}>
            <button className={`tab${tab==='login'?' active':''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`tab${tab==='register'?' active':''}`} onClick={() => setTab('register')}>Create Account</button>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>⚠ {error}</div>}

          <form onSubmit={submit}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Aditya Kumar" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group" style={{ marginBottom:'1.5rem' }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign:'center', fontSize:'0.8rem', color:'var(--text-muted)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="btn btn-ghost btn-sm" style={{fontSize:'0.8rem'}} onClick={() => setTab(tab==='login'?'register':'login')}>
              {tab === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="grid-3" style={{ marginTop:'1.5rem', gap:'0.75rem' }}>
          {[['🧠','Priority Score Algorithm'],['📅','3-Phase Study Plan'],['🔁','Spaced Repetition']].map(([icon, label]) => (
            <div key={label} className="card" style={{ padding:'0.75rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem' }}>{icon}</div>
              <p style={{ fontSize:'0.72rem', marginTop:'0.25rem', color:'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
