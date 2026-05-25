import React from 'react'

export default function Footer(){
  return (
    <footer className="site-footer" style={{position:'fixed', left:0, right:0, bottom:0, zIndex:45, background:'var(--color-surface)', borderTop:'1px solid var(--color-border)', height:64}}>
      <div className="page-container" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, height:'100%', paddingTop:0, paddingBottom:0, flexWrap:'nowrap', whiteSpace:'nowrap', overflow:'hidden'}}>
        <div style={{minWidth:0, whiteSpace:'nowrap', lineHeight:1.1}}>
          <div style={{fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--color-primary)', whiteSpace:'nowrap'}}>Lumina AI</div>
          <div style={{whiteSpace:'nowrap', fontSize:12, color:'var(--color-text-muted)'}}>Lesson plans, illuminated.</div>
        </div>
        <div style={{maxWidth:'none', flex:1, textAlign:'right', minWidth:0, whiteSpace:'nowrap', lineHeight:1.1}}>
          <div style={{whiteSpace:'nowrap', fontSize:12, color:'var(--color-text-muted)'}}>Lumina outputs are AI-generated drafts. Always review before classroom use.</div>
        </div>
      </div>
    </footer>
  )
}
