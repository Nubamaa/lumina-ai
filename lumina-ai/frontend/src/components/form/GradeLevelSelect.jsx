import React from 'react'

export default function GradeLevelSelect({value,onChange}){
  return (
    <div style={{marginBottom:8}}>
      <label>Grade Level</label>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',height:34,padding:'6px 10px',fontSize:12,borderRadius:8,border:'1px solid #E2E8F0'}}>
        <option value="">Select grade level</option>
        <optgroup label="Early Years">
          <option value="Kindergarten">Kindergarten</option>
        </optgroup>
        <optgroup label="Key Stage 1">
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
        </optgroup>
        <optgroup label="Key Stage 2">
          <option value="Grade 4">Grade 4</option>
          <option value="Grade 5">Grade 5</option>
          <option value="Grade 6">Grade 6</option>
        </optgroup>
        <optgroup label="Junior High">
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
        </optgroup>
        <optgroup label="Senior High">
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
        </optgroup>
      </select>
    </div>
  )
}
