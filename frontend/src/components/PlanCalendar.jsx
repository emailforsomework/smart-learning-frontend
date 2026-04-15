import React, { useState } from 'react'
import TopicCard from './TopicCard'

const PHASE_COLORS = { learning:'var(--primary)', revision:'var(--secondary)', mock:'var(--warning)' }

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })
}

function isToday(d) {
  const t = new Date(); t.setHours(0,0,0,0)
  const x = new Date(d); x.setHours(0,0,0,0)
  return t.getTime() === x.getTime()
}

function isPast(d) {
  const t = new Date(); t.setHours(0,0,0,0)
  const x = new Date(d); x.setHours(0,0,0,0)
  return x < t
}

export default function PlanCalendar({ plan }) {
  const [expanded, setExpanded] = useState(() => {
    // Auto-expand today or the nearest future day
    const todayIdx = plan.schedule.findIndex((d) => isToday(d.date))
    return todayIdx >= 0 ? todayIdx : plan.schedule.findIndex((d) => !isPast(d.date))
  })

  if (!plan?.schedule?.length) return null

  // Group by week
  const weeks = []
  for (let i = 0; i < plan.schedule.length; i += 7) {
    weeks.push(plan.schedule.slice(i, i + 7))
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom:'1rem' }}>
        <span className="section-title">Study Schedule</span>
        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{plan.schedule.length} days</span>
      </div>

      {plan.schedule.map((day, idx) => {
        const done  = day.topics.filter((t) => t.status === 'completed').length
        const total = day.topics.length
        const pct   = total > 0 ? (done / total) * 100 : 0
        const today = isToday(day.date)
        const past  = isPast(day.date)
        const open  = expanded === idx

        return (
          <div key={idx} style={{ marginBottom:'0.5rem' }}>
            {/* Day header */}
            <div
              onClick={() => setExpanded(open ? -1 : idx)}
              style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                padding:'0.75rem 1rem', borderRadius:'var(--radius-md)',
                background: today ? 'rgba(108,99,255,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${today ? 'var(--primary)' : 'var(--border)'}`,
                cursor:'pointer', transition:'all 0.2s',
                opacity: past && !today ? 0.6 : 1,
              }}
            >
              {/* Phase dot */}
              <div style={{ width:10, height:10, borderRadius:'50%', background: PHASE_COLORS[day.phase], flexShrink:0 }} />

              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  {today && <span className="badge badge-primary" style={{fontSize:'0.65rem'}}>TODAY</span>}
                  <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{formatDate(day.date)}</span>
                  <span className={`badge badge-${day.phase}`} style={{fontSize:'0.65rem'}}>{day.phase}</span>
                </div>
              </div>

              {/* Mini progress */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                <span>{done}/{total}</span>
                <div style={{ width:60, height:4, background:'var(--bg-base)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background: PHASE_COLORS[day.phase], transition:'width 0.4s' }} />
                </div>
                <span style={{ fontSize:'0.75rem' }}>{open ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Topics */}
            {open && (
              <div style={{ paddingTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                {day.topics.length === 0 ? (
                  <p style={{ padding:'0.75rem', color:'var(--text-muted)', fontSize:'0.85rem' }}>No topics scheduled for this day.</p>
                ) : (
                  day.topics.map((topic) => (
                    <TopicCard key={topic.topicId} topic={topic} planId={plan._id} phase={day.phase} />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
