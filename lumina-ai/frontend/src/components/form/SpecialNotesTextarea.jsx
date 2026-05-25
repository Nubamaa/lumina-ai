import React from 'react'

export default function SpecialNotesTextarea({value,onChange}){
  return (
    <div style={{marginBottom:8}}>
      <label>Special Notes (optional)</label>
      <textarea rows={3} value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'6px 10px',fontSize:12,borderRadius:8,border:'1px solid #E2E8F0'}} />
    </div>
  )
}
