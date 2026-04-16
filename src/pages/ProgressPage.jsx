import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReadinessHistory } from '../services/progressApi'
import { getActivePlan } from '../services/planApi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'0.75rem', fontSize:'0.85rem' }}>
        <p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.key} style={{ color: p.color, fontWeight:600 }}>{p.name}: {p.value}{p.name==='Readiness'?'%':' min'}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function ProgressPage() {
  const { data: histData } = useQuery({ queryKey:['readinessHistory'], queryFn: () => getReadinessHistory().then(r => r.data) })
  const { data: planData } = useQuery({ queryKey:['activePlan'], queryFn: () => getActivePlan().then(r => r.data) })

  const history = histData?.history || []
  const plan    = planData?.plan
  const stats   = planData?.stats
  const readiness = planData?.readinessScore || 0

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
    Readiness: h.readinessScore,
    Duration:  h.sessionDurationMinutes,
  }))

  // Phase breakdown from plan
  const phases = plan ? ['learning','revision','mock'].map((phase) => {
    const days = plan.schedule.filter((d) => d.phase === phase)
    const total = days.flatMap((d) => d.topics).length
    const done  = days.flatMap((d) => d.topics).filter((t) => t.status === 'completed').length
    return { phase, total, done, pct: total > 0 ? Math.round(done/total*100) : 0 }
  }) : []

  return (
    <div className="page">
      <div className="container animate-in">
        <div style={{ marginBottom:'2rem' }}>
          <h1>📊 Progress Tracker</h1>
          <p>Your study journey, visualized</p>
        </div>

        {/* Quick stats */}
        <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
          {[
            { label:'Readiness Score', value:`${readiness}%`, color:'var(--primary)' },
            { label:'Topics Done',     value: stats?.completed || 0, color:'var(--success)' },
            { label:'Topics Left',     value: stats?.pending || 0, color:'var(--text-secondary)' },
            { label:'Skipped',         value: stats?.skipped || 0, color:'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card stat-card">
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Phase breakdown */}
        {phases.length > 0 && (
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <div className="section-header"><span className="section-title">Phase Completion</span></div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {phases.map(({ phase, total, done, pct }) => (
                <div key={phase}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontSize:'0.9rem' }}>
                    <span style={{ fontWeight:600, textTransform:'capitalize' }}>
                      <span className={`badge badge-${phase}`}>{phase}</span>
                    </span>
                    <span style={{ color:'var(--text-muted)' }}>{done}/{total} — {pct}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width:`${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Readiness chart */}
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="section-header"><span className="section-title">Readiness Score Trend</span></div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <YAxis domain={[0,100]} tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Readiness" stroke="var(--primary)" strokeWidth={2} dot={{ fill:'var(--primary)', r:4 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding:'2rem' }}>
              <div className="empty-state-icon">📈</div>
              <p>Log study sessions to see your progress chart</p>
            </div>
          )}
        </div>

        {/* Session duration chart */}
        <div className="card">
          <div className="section-header"><span className="section-title">Daily Study Duration (min)</span></div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Duration" fill="var(--secondary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding:'2rem' }}>
              <p>No session data yet. Use the Pomodoro timer to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
