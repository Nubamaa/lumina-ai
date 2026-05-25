import React from 'react'
import DLPToolbar from './DLPToolbar'

export default function DLPHeader({data, pills = {}, toolbarProps = null}){
  if(!data) return null
  const leftColumn = [
    ['School', data.school || ''],
    ['Teacher', data.teacher || ''],
    ['Quarter', data.quarter || ''],
    ['Date', data.date || ''],
  ]
  const rightColumn = [
    ['Grade Level', data.grade_level || ''],
    ['Learning Area', data.learning_area || data.subject || ''],
    ['Duration', data.duration || ''],
    ['Section', data.section || ''],
  ]
  return (
    <div style={{width:'100%'}}>
      {/* Top header row: pills (left). Toolbar is rendered in the document title row above. */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'flex-start', marginBottom:10}}>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          {pills.curriculum && <div style={{background:'#f3f4f6', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#6b7280', fontWeight:500}}>{pills.curriculum}</div>}
          {pills.strand && <div style={{background:'#f3f4f6', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#6b7280', fontWeight:500}}>{pills.strand}</div>}
          {pills.outputFormat && <div style={{background:'#f3f4f6', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#6b7280', fontWeight:500}}>{pills.outputFormat}</div>}
          {pills.source && <div style={{background:'#f3f4f6', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#6b7280', fontWeight:500}}>{pills.source}</div>}
        </div>
      </div>

      <table className="dlp-table dlp-section-table dlp-header-table">
      <thead>
        <tr><th colSpan="2">Header Information</th></tr>
      </thead>
      <tbody>
        {leftColumn.map(([leftLabel, leftValue], index) => {
          const [rightLabel, rightValue] = rightColumn[index]
          return (
            <tr key={leftLabel}>
              <td>
                <div className="dlp-paired-field">
                  <span>{leftLabel}</span>
                  <strong>{leftValue || ''}</strong>
                </div>
              </td>
              <td>
                <div className="dlp-paired-field">
                  <span>{rightLabel}</span>
                  <strong>{rightValue || ''}</strong>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}
