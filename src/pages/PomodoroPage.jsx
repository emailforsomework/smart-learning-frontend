import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getActivePlan } from '../services/planApi'
import { startPomodoro, completePomodoro, getActivePomodoro } from '../services/pomodoroApi'
import { logSession } from '../services/progressApi'

const MODES = [
  { label:'Focus', duration:25, color:'var(--primary)' },
  { label:'Short Break', duration:5, color:'var(--success)' },
  { label:'Long Break', duration:15, color:'var(--secondary)' },
]

export default function PomodoroPage() {
  const [mode, setMode]           = useState(0)
  const [timeLeft, setTimeLeft]   = useState(MODES[0].duration * 60)
  const [running, setRunning]     = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [selectedTopic, setTopic] = useState(null)
  const [completedCount, setCompleted] = useState(0)
  const intervalRef = useRef(null)

  const { data: planData } = useQuery({ queryKey:['activePlan'], queryFn: () => getActivePlan().then(r => r.data) })
  const { data: activeData, refetch } = useQuery({ queryKey:['activePomodoro'], queryFn: () => getActivePomodoro().then(r => r.data), refetchInterval: false })

  // Resume from server session
  useEffect(() => {
    if (activeData?.session) {
      const s = activeData.session
      setSessionId(s._id)
      
      // Reconcile server state with local storage (fixes refresh race condition)
      const localRunning = localStorage.getItem('pomodoro_running')
      const isRunning = localRunning !== null ? localRunning === 'true' : s.isRunning
      
      setTimeLeft(s.remaining || 0)
      setRunning(isRunning)
    }
  }, [activeData])

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(intervalRef.current); setRunning(false); handleComplete(); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const startMut = useMutation({
    mutationFn: () => startPomodoro({
      planId: planData?.plan?._id,
      topicId: selectedTopic?.topicId || 'general',
      topicName: selectedTopic?.topic || 'General Study',
      subjectName: selectedTopic?.subject || '',
      duration: MODES[mode].duration,
    }).then((r) => r.data),
    onSuccess: (d) => { setSessionId(d.session._id); setRunning(true) },
  })

  const toggleMut = useMutation({
    mutationFn: (isRunning) => togglePomodoro(sessionId, { isRunning, remainingSeconds: timeLeft })
  })

  const handleStart = () => {
    if (!sessionId) {
      setTimeLeft(MODES[mode].duration * 60)
      localStorage.setItem('pomodoro_running', 'true')
      startMut.mutate()
    } else {
      const nextState = !running
      setRunning(nextState)
      localStorage.setItem('pomodoro_running', String(nextState))
      toggleMut.mutate(nextState)
    }
  }

  const handleComplete = async () => {
    if (sessionId) { await completePomodoro(sessionId).catch(() => {}); setSessionId(null) }
    setCompleted((c) => c + 1)
    // Log session after each completed pomodoro (if a plan exists)
    if (planData?.plan?._id) {
      await logSession({ planId: planData.plan._id, sessionDurationMinutes: MODES[mode].duration, pomodoroCount: 1 }).catch(() => {})
    }
  }

  const reset = () => {
    setRunning(false)
    localStorage.setItem('pomodoro_running', 'false')
    setTimeLeft(MODES[mode].duration * 60)
    if (sessionId) togglePomodoro(sessionId, { isRunning: false, remainingSeconds: MODES[mode].duration * 60 })
    setSessionId(null)
  }

  const changeMode = (i) => { setMode(i); setRunning(false); setTimeLeft(MODES[i].duration * 60) }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const totalSeconds = MODES[mode].duration * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  // All pending topics for selection
  const allTopics = planData?.plan?.schedule?.flatMap((d) => d.topics.filter((t) => t.status !== 'completed')) || []

  return (
    <div className="page">
      <div className="container animate-in" style={{ maxWidth:600 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <h1>🍅 Pomodoro Timer</h1>
          <p>Server-synced — pick up from any device</p>
        </div>

        {/* Mode tabs */}
        <div className="tabs" style={{ marginBottom:'2rem' }}>
          {MODES.map((m, i) => (
            <button key={m.label} className={`tab${mode===i?' active':''}`} onClick={() => changeMode(i)}
              style={mode===i?{background:m.color}:{}}>{m.label}</button>
          ))}
        </div>

        {/* Timer ring */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'2rem' }}>
          <div className="pomodoro-ring" style={{ '--progress':`${progress}%`, background:`conic-gradient(${MODES[mode].color} ${progress}%, var(--bg-elevated) 0%)` }}>
            <div className="pomodoro-inner">
              <div className="pomodoro-time" style={{ color: MODES[mode].color }}>{mins}:{secs}</div>
              <div className="pomodoro-label">{running ? 'Focus!' : 'Ready'}</div>
            </div>
          </div>
        </div>

        {/* Completed count */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ display:'inline-flex', gap:'0.4rem' }}>
            {[...Array(Math.min(completedCount, 8))].map((_,i) => (
              <span key={i} style={{ fontSize:'1.25rem' }}>🍅</span>
            ))}
            {completedCount === 0 && <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Complete sessions to earn tomatoes</span>}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', marginBottom:'2rem' }}>
          <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={startMut.isPending || !planData?.plan}
            style={{ minWidth:140, background: (running && planData?.plan) ? 'linear-gradient(135deg,#ff6b6b,#ff9999)' : (!planData?.plan ? 'var(--text-muted)' : '') }}>
            {running ? '⏸ Pause' : sessionId ? '▶ Resume' : '▶ Start'}
          </button>
          <button className="btn btn-secondary" onClick={reset} disabled={!planData?.plan}>↩ Reset</button>
        </div>

        {!planData?.plan && (
          <div className="alert alert-warning" style={{ textAlign:'center', marginBottom:'2rem' }}>
            📅 Please <a href="/generate" style={{ fontWeight:700 }}>create a study plan</a> first to enable the timer.
          </div>
        )}

        {/* Topic selector */}
        {planData?.plan && (
          <div className="card">
            <h4 style={{ marginBottom:'0.75rem' }}>📌 Studying:</h4>
            <select className="form-input" value={selectedTopic?.topicId || ''}
              onChange={(e) => {
                const t = allTopics.find((x) => x.topicId === e.target.value)
                setTopic(t || null)
              }}>
              <option value="">General Study</option>
              {allTopics.map((t) => (
                <option key={t.topicId} value={t.topicId}>{t.subject} — {t.topic}</option>
              ))}
            </select>
            {selectedTopic && (
              <div style={{ marginTop:'0.75rem', fontSize:'0.85rem', color:'var(--text-secondary)' }}>
                ⏱ Planned: {selectedTopic.duration} min &nbsp;|&nbsp;
                Priority: {selectedTopic.priorityScore?.toFixed(3)}
              </div>
            )}
          </div>
        )}

        {/* Tip */}
        <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
          Sessions are saved to the server — switch devices and your timer resumes automatically.
        </div>
      </div>
    </div>
  )
}
