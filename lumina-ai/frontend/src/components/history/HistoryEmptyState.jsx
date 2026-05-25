import React from 'react'

export default function HistoryEmptyState(){
  return (
    <div style={{padding:24, textAlign:'center'}}>
      <h4>No saved plans yet</h4>
      <p style={{color:'var(--color-text-muted)'}}>Save a generated lesson plan to see it here.</p>
    </div>
  )
}
