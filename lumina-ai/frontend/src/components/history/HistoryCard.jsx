import React from 'react'

export default function HistoryCard({plan}){
  const badges = [
    plan.curriculum,
    plan.outputFormat ? `Format: ${plan.outputFormat}` : '',
    plan.source ? `Source: ${plan.source}` : '',
  ].filter(Boolean)

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm history-card-shell">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-800">{plan.subject || plan.topic || 'Untitled Lesson'}</div>
          <div className="text-sm text-slate-500">{(plan.gradeLevel || plan.grade ? `${plan.gradeLevel || plan.grade}` : '')}{plan.topic ? ((plan.gradeLevel || plan.grade) ? ' • ' : '') + plan.topic : ''}</div>
          <div className="text-xs text-slate-400 mt-1">{plan.duration ? `${plan.duration} Min` : ''}{plan.saved_at ? ` • ${new Date(plan.saved_at).toLocaleDateString()}` : ''}</div>
          <div className="flex flex-wrap gap-2 mt-3">
            {badges.map((badge) => <span key={badge} className="history-badge">{badge}</span>)}
            {Array.isArray(plan.competencyCodes) && plan.competencyCodes.slice(0, 4).map((code) => <span key={code} className="history-badge history-badge--green">{code}</span>)}
            {Array.isArray(plan.warnings) && plan.warnings.length > 0 && <span className="history-badge history-badge--amber">{plan.warnings.length} warnings</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded-md border border-slate-100 text-sm" onClick={()=>{ /* view handler */ }}>View Plan</button>
          <button className="px-3 py-1 rounded-md bg-red-50 text-red-600 text-sm border border-red-100" onClick={()=>{ /* delete handler */ }}>Delete</button>
        </div>
      </div>
    </div>
  )
}
