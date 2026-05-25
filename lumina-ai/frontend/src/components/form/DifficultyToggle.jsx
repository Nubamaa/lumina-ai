import React from 'react'

export default function DifficultyToggle({value,onChange}){
  return (
    <div style={{marginBottom:8}}>
      <label>Difficulty</label>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:5}}>
        {['Basic','Intermediate','Advanced'].map(d=> (
          <button
            key={d}
            type="button"
            onClick={()=>onChange(d)}
            style={{
              height:34,
              borderRadius:999,
              border: value===d ? '1px solid #0D9488' : '1px solid #E2E8F0',
              background: value===d ? '#0D9488' : '#FFFFFF',
              color: value===d ? '#FFFFFF' : '#64748B',
              fontWeight:600,
              fontSize:12,
              cursor:'pointer',
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}
