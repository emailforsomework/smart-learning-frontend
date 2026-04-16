import React from 'react'

const PHASES = [
  { key:'learning', label:'Learning', color:'var(--primary)', icon:'📖' },
  { key:'revision', label:'Revision', color:'var(--secondary)', icon:'🔁' },
  { key:'mock',     label:'Mock',     color:'var(--warning)',   icon:'📝' },
]

export default function PhaseProgressBar({ plan, stats }) {
  if (!plan?.schedule) return null

  const phaseStats = PHASES.map(({ key, label, color, icon }) => {
    const days  = plan.schedule.filter((d) => d.phase === key)
    const total = days.flatMap((d) => d.topics).length
    const done  = days.flatMap((d) => d.topics).filter((t) => t.status === 'completed').length
    const pct   = total > 0 ? Math.round(done / total * 100) : 0
    return { key, label, color, icon, total, done, pct, days: days.length }
  })

  const overallTotal = phaseStats.reduce((s, p) => s + p.total, 0)

  return (
    <div>
      <h3 style={{ marginBottom:'1.25rem' }}>Phase Progress</h3>

      {/* Combined bar */}
      <div style={{ display:'flex', height:10, borderRadius:'var(--radius-full)', overflow:'hidden', marginBottom:'1.25rem' }}>
        {phaseStats.map(({ key, color, total }) => (
          <div key={key} style={{ flex: total, background: color, opacity:0.3 }} />
        ))}
      </div>

      {phaseStats.map(({ key, label, color, icon, total, done, pct, days }) => (
        <div key={key} style={{ marginBottom:'1.2rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span>{icon}</span>
              <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{label}</span>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{days} days</span>
            </div>
            <span style={{ fontSize:'0.85rem', fontWeight:700, color }}>
              {done}/{total} — {pct}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width:`${pct}%`, background:color }} />
          </div>
        </div>
      ))}

      <div style={{ paddingTop:'0.75rem', borderTop:'1px solid var(--border)', fontSize:'0.82rem', color:'var(--text-muted)', textAlign:'center' }}>
        {stats?.completed || 0} of {overallTotal} total topics completed
      </div>
    </div>
  )
}
