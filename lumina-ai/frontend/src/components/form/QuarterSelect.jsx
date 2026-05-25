import React from 'react'

export default function QuarterSelect({value,onChange}){
  return (
    <div style={{marginBottom:8}}>
      <label>Quarter</label>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',height:34,padding:'6px 10px',fontSize:12,borderRadius:8,border:'1px solid #E2E8F0'}}>
        <option value="1st Quarter">1st Quarter</option>
        <option value="2nd Quarter">2nd Quarter</option>
        <option value="3rd Quarter">3rd Quarter</option>
        <option value="4th Quarter">4th Quarter</option>
      </select>
    </div>
  )
}
