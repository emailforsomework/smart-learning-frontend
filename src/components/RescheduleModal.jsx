import React from 'react'

export default function RescheduleModal({ result, onClose }) {
  if (!result) return null

  const isExamClose   = result.status === 'EXAM_TOO_CLOSE'
  const droppedCount  = result.droppedTopics?.length || 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
          <span style={{ fontSize:'2rem' }}>{isExamClose ? '🚨' : droppedCount > 0 ? '⚠️' : '✅'}</span>
          <div>
            <h3 style={{ marginBottom:0 }}>
              {isExamClose ? 'Exam Too Close' : droppedCount > 0 ? 'Partial Reschedule' : 'Rescheduled!'}
            </h3>
            <p style={{ fontSize:'0.85rem', marginTop:'0.1rem' }}>{result.message}</p>
          </div>
        </div>

        {isExamClose && (
          <div className="alert alert-danger">
            No remaining days to reschedule into. Focus on your top priority topics!
          </div>
        )}

        {droppedCount > 0 && !isExamClose && (
          <>
            <div className="alert alert-warning">
              {droppedCount} topic(s) could not be placed — not enough capacity in remaining days.
            </div>
            <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:'1rem', marginBottom:'1rem' }}>
              <h4 style={{ marginBottom:'0.75rem', fontSize:'0.85rem', color:'var(--text-muted)' }}>Dropped Topics:</h4>
              {result.droppedTopics.map((t, i) => (
                <div key={i} style={{ display:'flex', gap:'0.5rem', padding:'0.4rem 0', borderBottom: i < droppedCount-1 ? '1px solid var(--border)' : 'none', fontSize:'0.88rem' }}>
                  <span style={{ color:'var(--accent)' }}>✕</span>
                  <span style={{ color:'var(--text-secondary)' }}>{t.subject}</span>
                  <span style={{ color:'var(--text-muted)' }}>—</span>
                  <span>{t.topic}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {result.status === 'SUCCESS' && droppedCount === 0 && (
          <div className="alert alert-success">
            ✅ All missed topics have been successfully redistributed across remaining days.
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}
