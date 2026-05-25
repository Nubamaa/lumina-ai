import React from 'react'

export default function DLPProcedures({data}){
  if(!data || !Array.isArray(data)) return null
  return (
    <section className="dlp-section dlp-section--procedures">
      <table className="dlp-table dlp-section-table">
        <thead>
          <tr><th colSpan="5">IV. Procedures</th></tr>
          <tr>
            <th style={{width:'8%'}}>Step</th>
            <th style={{width:'18%'}}>Title</th>
            <th>Teacher's Activity</th>
            <th>Student's Activity</th>
            <th style={{width:'10%'}}>Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((step, idx)=> (
            <tr key={idx}>
              <th>{step.step_letter || String(idx + 1)}</th>
              <td>{step.title || ''}</td>
              <td>{step.teacher_dialogue || step.teacher_activity || step.content || ''}</td>
              <td>{step.student_responses || step.learner_activity || ''}</td>
              <td>{step.time || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
