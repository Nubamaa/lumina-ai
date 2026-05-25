import React from 'react'

export default function DLPObjectives({data}){
  if(!data) return null
  return (
    <section className="dlp-section dlp-section--objectives">
      <table className="dlp-table dlp-section-table">
        <thead>
          <tr><th colSpan="2">I. Objectives</th></tr>
        </thead>
        <tbody>
          <tr>
            <th>Objective</th>
            <td>
              <table className="dlp-nested-table">
                <tbody>
                  {data.map((objective, index) => (
                    <tr key={index}>
                      <th>{index + 1}</th>
                      <td>{objective}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
