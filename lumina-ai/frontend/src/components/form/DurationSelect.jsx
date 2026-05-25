import React from 'react'

export default function DurationSelect({value,onChange}){
  return (
    <div style={{marginBottom:8}}>
      <label>Duration</label>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',height:34,padding:'6px 10px',fontSize:12,borderRadius:8,border:'1px solid #E2E8F0'}}>
        <option value="30 Minutes">30 Minutes</option>
        <option value="40 Minutes">40 Minutes</option>
        <option value="45 Minutes">45 Minutes</option>
        <option value="60 Minutes">60 Minutes</option>
        <option value="90 Minutes">90 Minutes</option>
      </select>
    </div>
  )
}
