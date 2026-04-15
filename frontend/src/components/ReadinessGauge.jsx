import React from 'react'

export default function ReadinessGauge({ score = 0 }) {
  // SVG arc gauge
  const radius   = 80
  const stroke   = 12
  const norm     = 2 * Math.PI * radius
  const dashFill = (score / 100) * norm * 0.75 // 270-degree sweep

  const color = score >= 75 ? '#4ECDC4' : score >= 50 ? '#6C63FF' : score >= 25 ? '#FFD166' : '#FF6B6B'

  return (
    <div style={{ position:'relative', width:200, height:160 }}>
      <svg width="200" height="170" viewBox="0 0 200 170" style={{ transform:'rotate(-135deg)' }}>
        {/* Track */}
        <circle cx="100" cy="100" r={radius} fill="none"
          stroke="var(--bg-elevated)" strokeWidth={stroke}
          strokeDasharray={`${norm * 0.75} ${norm}`}
          strokeLinecap="round" />
        {/* Fill */}
        <circle cx="100" cy="100" r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dashFill} ${norm}`}
          strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.8s ease, stroke 0.4s ease' }} />
      </svg>

      {/* Center text */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%, -45%)',
        textAlign:'center',
      }}>
        <div style={{ fontSize:'2.2rem', fontWeight:800, color, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Readiness</div>
      </div>
    </div>
  )
}
