import React from 'react'

export default function LearningStyleSelect({value,onChange}){
  return (
    <div style={{marginBottom:12}}>
      <label>Learning Style</label>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:8,borderRadius:8}}>
        <option value="Visual">Visual</option>
        <option value="Auditory">Auditory</option>
        <option value="Kinesthetic">Kinesthetic</option>
        <option value="Reading-Writing">Reading-Writing</option>
      </select>
    </div>
  )
}
