import React from 'react'

function Badge({children, tone = 'neutral'}) {
  const colors = {
    neutral: { background: '#F3F4F6', color: '#374151' },
    green: { background: '#DCFCE7', color: '#166534' },
    amber: { background: '#FEF3C7', color: '#92400E' },
    red: { background: '#FEE2E2', color: '#B91C1C' },
    blue: { background: '#DBEAFE', color: '#1D4ED8' },
  }
  const palette = colors[tone] || colors.neutral
  return (
    <span style={{display:'inline-flex', alignItems:'center', borderRadius:999, padding:'4px 10px', fontSize:12, fontWeight:600, background:palette.background, color:palette.color}}>
      {children}
    </span>
  )
}

export default function CompetencyTracker({
  curriculum,
  competencyCodes = [],
  objectives = [],
  bloomsLevels = [],
  warnings = [],
  sectionCompleteness = [],
  source = '',
}) {
  // Accept either an array or an object (normalize for safety)
  const sections = Array.isArray(sectionCompleteness)
    ? sectionCompleteness
    : (sectionCompleteness && typeof sectionCompleteness === 'object')
      ? Object.values(sectionCompleteness)
      : []

  const completedCount = sections.filter(section => section && section.complete).length
  const totalCount = sections.length || 13

  return (
    <section style={{marginBottom:16, background:'white', border:'1px solid #E5E7EB', borderRadius:14, padding:16}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12}}>
        <div>
          <div style={{fontWeight:700, color:'#1E2A45'}}>Competency Tracker</div>
          <div style={{fontSize:12, color:'#6B7280'}}>Framework, codes, blooms, and section coverage</div>
        </div>
        <Badge tone={completedCount === totalCount ? 'green' : 'amber'}>
          {completedCount}/{totalCount} sections covered
        </Badge>
      </div>

      <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:12}}>
        {curriculum && <Badge tone="blue">{curriculum}</Badge>}
        {source && <Badge tone="neutral">{source}</Badge>}
        {bloomsLevels.map(level => <Badge key={level} tone="amber">{level}</Badge>)}
      </div>

      {competencyCodes.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12, fontWeight:700, color:'#374151', marginBottom:8}}>Competency Codes</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {competencyCodes.map(code => <Badge key={code} tone="green">{code}</Badge>)}
          </div>
        </div>
      )}

      {objectives.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12, fontWeight:700, color:'#374151', marginBottom:8}}>Objectives</div>
          <div style={{display:'grid', gap:8}}>
            {objectives.slice(0, 5).map((objective, index) => (
              <div key={index} style={{padding:'10px 12px', borderRadius:10, background:'#F9FAFB', border:'1px solid #E5E7EB', fontSize:13, color:'#1F2937'}}>
                {objective}
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <div style={{fontSize:12, fontWeight:700, color:'#374151', marginBottom:8}}>Warnings</div>
          <div style={{display:'grid', gap:6}}>
            {warnings.slice(0, 5).map((warning, index) => (
              <div key={index} style={{padding:'10px 12px', borderRadius:10, background:'#FEF2F2', border:'1px solid #FECACA', fontSize:13, color:'#991B1B'}}>
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}