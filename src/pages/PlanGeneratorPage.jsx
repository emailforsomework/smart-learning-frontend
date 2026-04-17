import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPlan } from '../services/planApi'

const DIFFICULTIES = [1, 2, 3, 4, 5]
const DIFFICULTY_LABELS = { 1:'Very Easy', 2:'Easy', 3:'Medium', 4:'Hard', 5:'Very Hard' }

const emptySubject = () => ({ name:'', isWeak:false, difficultyRating:3, topics:'' })

export default function PlanGeneratorPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(1) // 1: exam info, 2: subjects
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    examDate: '',
    dailyStudyHours: '',
    targetScore: '',
    subjects: [emptySubject()],
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const subjects = form.subjects
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name.trim(),
          isWeak: s.isWeak,
          difficultyRating: s.difficultyRating,
          topics: s.topics.split(',').map((t) => t.trim()).filter(Boolean),
        }))
      const res = await createPlan({
        title: form.title,
        examDate: form.examDate,
        dailyStudyHours: Number(form.dailyStudyHours),
        subjects,
        goal: { targetScore: Number(form.targetScore) || null },
      })
      return res.data
    },
    onSuccess: () => { qc.invalidateQueries(['activePlan']); navigate('/') },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setError(data.errors.map(e => e.message).join(', '));
      } else {
        setError(data?.message || 'Failed to generate plan');
      }
    },
  })

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const updateSubject = (i, k, v) =>
    setForm((f) => { const s=[...f.subjects]; s[i]={...s[i],[k]:v}; return {...f,subjects:s} })

  const addSubject = () =>
    setForm((f) => ({ ...f, subjects: [...f.subjects, emptySubject()] }))

  const removeSubject = (i) =>
    setForm((f) => ({ ...f, subjects: f.subjects.filter((_,j) => j!==i) }))

  return (
    <div className="page">
      <div className="container animate-in" style={{ maxWidth:720 }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1>✨ Create Study Plan</h1>
          <p>Our algorithm builds your schedule in 3 phases: Learn → Revise → Mock</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2rem' }}>
          {['Exam Details','Subjects'].map((label, i) => (
            <div key={label} onClick={() => setStep(i+1)}
              style={{ flex:1, padding:'0.6rem', borderRadius:'var(--radius-md)', cursor:'pointer', textAlign:'center', fontSize:'0.85rem', fontWeight:600,
                background: step===i+1 ? 'var(--primary)' : 'var(--bg-elevated)',
                color: step===i+1 ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${step===i+1?'var(--primary)':'var(--border)'}`,
              }}>
              {i+1}. {label}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom:'1.25rem' }}>⚠ {error}</div>}

        <div className="card" style={{ padding:'2rem' }}>

          {step === 1 && (
            <>
              <h3 style={{ marginBottom:'1.5rem' }}>📋 Exam Information</h3>
              <div className="form-group">
                <label className="form-label">Plan Title</label>
                <input className="form-input" placeholder="e.g. JEE Mains 2025" value={form.title} onChange={setField('title')} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input className="form-input" type="date" value={form.examDate} onChange={setField('examDate')} min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Study Hours</label>
                  <input className="form-input" type="number" min="1" max="16" placeholder="e.g. 5" value={form.dailyStudyHours} onChange={setField('dailyStudyHours')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Score (optional)</label>
                <input className="form-input" type="number" placeholder="e.g. 85" value={form.targetScore} onChange={setField('targetScore')} />
              </div>
              <button className="btn btn-primary btn-full" style={{ marginTop:'0.5rem' }}
                onClick={() => {
                  setError('');
                  if (!form.title || !form.examDate || !form.dailyStudyHours) {
                    return setError('All fields are required');
                  }
                  if (new Date(form.examDate) < new Date().setHours(0,0,0,0)) {
                    return setError('Exam date must be in the future');
                  }
                  if (Number(form.dailyStudyHours) < 1 || Number(form.dailyStudyHours) > 16) {
                    return setError('Daily study hours must be between 1 and 16');
                  }
                  setStep(2);
                }}>
                Next: Add Subjects →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ marginBottom:'0.5rem' }}>📚 Subjects & Topics</h3>
              <p style={{ marginBottom:'1.5rem', fontSize:'0.85rem' }}>Mark weak subjects — they get 40% of the priority weight.</p>

              {form.subjects.map((sub, i) => (
                <div key={i} className="card-surface" style={{ marginBottom:'1rem', position:'relative' }}>
                  {form.subjects.length > 1 && (
                    <button className="btn btn-icon btn-ghost" onClick={() => removeSubject(i)}
                      style={{ position:'absolute', top:'0.75rem', right:'0.75rem', color:'var(--accent)' }}>✕</button>
                  )}

                  <div className="grid-2" style={{ marginBottom:'0.75rem' }}>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Subject Name</label>
                      <input className="form-input" placeholder="e.g. Mathematics" value={sub.name}
                        onChange={(e) => updateSubject(i,'name',e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Difficulty</label>
                      <select className="form-input" value={sub.difficultyRating}
                        onChange={(e) => updateSubject(i,'difficultyRating',Number(e.target.value))}>
                        {DIFFICULTIES.map((d) => (
                          <option key={d} value={d}>{d} — {DIFFICULTY_LABELS[d]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom:'0.75rem' }}>
                    <label className="form-label">Topics (comma-separated)</label>
                    <input className="form-input" placeholder="Algebra, Calculus, Trigonometry"
                      value={sub.topics} onChange={(e) => updateSubject(i,'topics',e.target.value)} />
                  </div>

                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer', fontSize:'0.9rem' }}>
                    <input type="checkbox" checked={sub.isWeak}
                      onChange={(e) => updateSubject(i,'isWeak',e.target.checked)}
                      style={{ width:18, height:18, accentColor:'var(--accent)' }} />
                    <span>⚠ Mark as <strong style={{ color:'var(--accent)' }}>weak subject</strong> (gets highest priority)</span>
                  </label>
                </div>
              ))}

              <button className="btn btn-secondary btn-full" style={{ marginBottom:'1rem' }} onClick={addSubject}>
                + Add Another Subject
              </button>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-full btn-lg" onClick={() => mutate()} disabled={isPending}>
                  {isPending ? <><span className="spinner" /> Generating your plan…</> : '✨ Generate Study Plan'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Algorithm explainer */}
        <div className="card" style={{ marginTop:'1rem', padding:'1.25rem' }}>
          <h4 style={{ marginBottom:'0.75rem' }}>🧠 How the Algorithm Works</h4>
          <div className="grid-3" style={{ gap:'0.75rem' }}>
            {[
              ['Priority Score','PS = 0.40×Weak + 0.25×Urgency + 0.20×Difficulty − 0.15×Confidence'],
              ['Time Allocation','Time per topic ∝ PS weight / total PS × available minutes'],
              ['3 Phases','60% Learning → 20% Revision → 20% Mock/Practice'],
            ].map(([title, desc]) => (
              <div key={title} style={{ padding:'0.75rem', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, marginBottom:'0.4rem', fontSize:'0.85rem', color:'var(--primary)' }}>{title}</div>
                <p style={{ fontSize:'0.75rem', lineHeight:1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
