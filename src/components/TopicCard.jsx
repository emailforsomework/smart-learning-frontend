import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTopic } from '../services/planApi'

const STATUS_ICONS = { pending:'⏳', 'in-progress':'📖', completed:'✅', skipped:'⏭' }
const STATUS_COLORS = { pending:'var(--text-muted)', 'in-progress':'var(--warning)', completed:'var(--success)', skipped:'var(--accent)' }

export default function TopicCard({ topic, planId, phase }) {
  const [showConfidence, setShowConfidence] = useState(false)
  const [hoverStar, setHoverStar] = useState(0)
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: (data) => updateTopic(planId, topic.topicId, data).then((r) => r.data),
    onMutate: async (newData) => {
      await qc.cancelQueries(['activePlan'])
      const previousPlan = qc.getQueryData(['activePlan'])
      
      qc.setQueryData(['activePlan'], (old) => {
        if (!old) return old
        // Deep clone and update the specific topic
        const updatedSchedule = old.plan.schedule.map(day => ({
          ...day,
          topics: day.topics.map(t => 
            t.topicId === topic.topicId ? { ...t, ...newData } : t
          )
        }))
        return { ...old, plan: { ...old.plan, schedule: updatedSchedule } }
      })

      return { previousPlan }
    },
    onError: (err, newData, context) => {
      qc.setQueryData(['activePlan'], context.previousPlan)
    },
    onSettled: () => {
      qc.invalidateQueries(['activePlan'])
    },
  })

  const markStatus = (status) => {
    mut.mutate({ status })
    if (status === 'completed') {
      setShowConfidence(true)
    } else {
      setShowConfidence(false)
    }
  }

  const setConfidence = (confidence) => {
    mut.mutate({ confidence, status: 'completed' })
  }

  const isCompleted = topic.status === 'completed'

  return (
    <div className="card" style={{
      padding:'1rem 1.25rem',
      borderColor: isCompleted ? 'rgba(78,205,196,0.3)' : 'var(--border)',
      opacity: isCompleted ? 0.75 : 1,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem' }}>

        {/* Status icon */}
        <button
          className="btn btn-icon"
          style={{ fontSize:'1.1rem', minWidth:32, color: STATUS_COLORS[topic.status], background:'var(--bg-elevated)', flexShrink:0 }}
          onClick={() => markStatus(isCompleted ? 'pending' : 'completed')}
          disabled={mut.isPending}
          title="Toggle complete"
        >
          {STATUS_ICONS[topic.status]}
        </button>

        <div style={{ flex:1, minWidth:0 }}>
          {/* Subject + phase badge */}
          <div style={{ display:'flex', align:'center', gap:'0.5rem', marginBottom:'0.2rem', flexWrap:'wrap' }}>
            <span className={`badge badge-${phase}`} style={{ fontSize:'0.7rem' }}>{phase}</span>
            {topic.isWeak && <span className="badge badge-danger" style={{ fontSize:'0.7rem' }}>⚠ Weak</span>}
          </div>

          {/* Topic name */}
          <div style={{
            fontWeight:600, fontSize:'0.95rem',
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
          }}>
            {topic.topic}
          </div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.1rem' }}>
            {topic.subject} · {topic.duration} min
            {topic.priorityScore > 0 && (
              <span style={{ marginLeft:'0.5rem', color:'var(--text-muted)', fontSize:'0.75rem' }}>
                PS: {topic.priorityScore.toFixed(3)}
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
          {topic.status !== 'completed' && (
            <>
              <button className="btn btn-icon btn-ghost btn-sm" style={{ fontSize:'0.7rem', padding:'0.3rem 0.5rem' }}
                onClick={() => markStatus('in-progress')} title="Mark in-progress">📖</button>
              <button className="btn btn-icon btn-ghost btn-sm" style={{ fontSize:'0.7rem', padding:'0.3rem 0.5rem', color:'var(--accent)' }}
                onClick={() => markStatus('skipped')} title="Skip">⏭</button>
            </>
          )}
        </div>
      </div>

      {/* Confidence rating — appears after marking complete */}
      {showConfidence && (
        <div style={{ marginTop:'0.875rem', paddingTop:'0.875rem', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
            How confident are you? (This enables spaced repetition)
          </div>
          <div className="star-rating">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`star${(hoverStar||topic.confidence)>=s?' active':''}`}
                onMouseEnter={() => setHoverStar(s)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setConfidence(s)}>★</span>
            ))}
            <span style={{ marginLeft:'0.5rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
              {hoverStar > 0 ? ['', 'Very Weak', 'Weak', 'Average', 'Strong', 'Mastered'][hoverStar] : 'Rate your confidence'}
            </span>
          </div>
          {topic.confidence && (
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.4rem' }}>
              ✅ Rated {topic.confidence}/5 — revision sessions scheduled automatically
            </div>
          )}
        </div>
      )}

      {/* Already has a confidence rating */}
      {!showConfidence && topic.confidence && (
        <div style={{ marginTop:'0.5rem', fontSize:'0.78rem', color:'var(--text-muted)' }}>
          {'★'.repeat(topic.confidence)}{'☆'.repeat(5-topic.confidence)} confidence
        </div>
      )}
    </div>
  )
}
