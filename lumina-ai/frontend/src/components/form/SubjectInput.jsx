import React from 'react'

export default function SubjectInput({value,onChange}){
  return (
    <div style={{marginBottom:8}}>
      <label>Subject Area</label>
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder="e.g. Filipino, Science, Mathematics" style={{width:'100%',height:34,padding:'6px 10px',fontSize:12,borderRadius:8,border:'1px solid #E2E8F0'}} />
    </div>
  )
}
