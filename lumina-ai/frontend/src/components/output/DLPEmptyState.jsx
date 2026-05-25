import React from 'react'

export default function DLPEmptyState(){
  return (
    <div style={{minHeight:'calc(100vh - 240px)', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center'}}>
        <div style={{width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12}}>
          <span className="material-symbols-outlined" style={{fontSize:56, color:'#D1D5DB'}}>menu_book</span>
        </div>
        <h3 style={{fontSize:18, fontWeight:600, color:'#64748B', margin:'0 0 12px'}}>DLP Workspace</h3>
        <p style={{fontSize:14, color:'#94A3B8', maxWidth:360, margin:0}}>Your generated DepEd Order No. 42 compliant lesson plan will appear here. Configure the parameters on the left to begin.</p>
      </div>
    </div>
  )
}
