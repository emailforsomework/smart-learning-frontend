import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActivePlan, reschedulePlan, archivePlan } from '../services/planApi'
import ReadinessGauge from '../components/ReadinessGauge'
import PhaseProgressBar from '../components/PhaseProgressBar'
import PlanCalendar from '../components/PlanCalendar'
import RescheduleModal from '../components/RescheduleModal'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const qc        = useQueryClient()
  const [rescheduleResult, setRescheduleResult] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['activePlan'],
    queryFn:  () => getActivePlan().then((r) => r.data),
  })

  const rescheduleMut = useMutation({
    mutationFn: () => reschedulePlan(data?.plan?._id).then((r) => r.data),
    onSuccess: (res) => { qc.invalidateQueries(['activePlan']); setRescheduleResult(res) },
  })

  const archiveMut = useMutation({
    mutationFn: () => archivePlan(data?.plan?._id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries(['activePlan']),
  })

  if (isLoading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span className="spinner" style={{width:40,height:40,borderWidth:3}} />
    </div>
  )

  const { plan, readinessScore = 0, stats = {}, daysUntilExam = 0 } = data || {}

  if (!plan) return (
    <div className="page">
      <div className="container">
        <div className="empty-state" style={{ paddingTop:'6rem' }}>
          <div className="empty-state-icon">📋</div>
          <h3>No Active Plan</h3>
          <p style={{ marginBottom:'1.5rem' }}>Generate a personalized study plan to get started</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/generate')}>
            ✨ Create Study Plan
          </button>
        </div>
      </div>
    </div>
  )

  // EMERGENCY MODE banner
  const isEmergency = plan.emergencyMode || daysUntilExam <= 1

  return (
    <div className="page">
      <div className="container animate-in">

        {isEmergency && (
          <div className="alert alert-danger" style={{ marginBottom:'1.5rem', fontSize:'1rem', fontWeight:700 }}>
            🚨 EMERGENCY MODE — Exam is tomorrow! Focus on top priority topics only.
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1>{plan.title}</h1>
            <p style={{ marginTop:'0.25rem' }}>
              📅 Exam in <strong style={{ color:'var(--secondary)' }}>{daysUntilExam} days</strong>
              {user?.currentStreak > 0 && <span style={{ marginLeft:'1rem', color:'var(--warning)' }}>🔥 {user.currentStreak} day streak</span>}
            </p>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => rescheduleMut.mutate()} disabled={rescheduleMut.isPending}>
              {rescheduleMut.isPending ? <span className="spinner" /> : '🔄'} Reschedule
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/generate')}>+ New Plan</button>
            <button className="btn btn-ghost btn-sm" style={{ color:'var(--accent)' }} onClick={() => archiveMut.mutate()}>Archive</button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
          {[
            { label:'Readiness', value:`${readinessScore}%`, color:'var(--primary)' },
            { label:'Completed', value:stats.completed || 0, color:'var(--success)' },
            { label:'Remaining', value:stats.pending || 0, color:'var(--text-secondary)' },
            { label:'Days Left',  value:daysUntilExam, color:'var(--secondary)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card stat-card">
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
          {/* Readiness gauge */}
          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', padding:'2rem' }}>
            <h3>Study Readiness</h3>
            <ReadinessGauge score={readinessScore} />
            <p style={{ fontSize:'0.85rem', textAlign:'center' }}>
              {readinessScore >= 75 ? '🌟 Looking strong!' : readinessScore >= 50 ? '📈 Keep pushing!' : '⚡ More study needed'}
            </p>
          </div>

          {/* Phase progress */}
          <div className="card">
            <PhaseProgressBar plan={plan} stats={stats} />
          </div>
        </div>

        {/* Dropped topics warning */}
        {plan.droppedTopics?.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom:'1.5rem' }}>
            ⚠ {plan.droppedTopics.length} topic(s) were dropped due to time constraints.
          </div>
        )}

        {/* Schedule calendar */}
        <PlanCalendar plan={plan} />
      </div>

      {/* Reschedule result modal */}
      {rescheduleResult && (
        <RescheduleModal result={rescheduleResult} onClose={() => setRescheduleResult(null)} />
      )}
    </div>
  )
}
