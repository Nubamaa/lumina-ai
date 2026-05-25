import React, { useMemo, useState } from 'react'
import DLPToolbar from './DLPToolbar'
import DLPHeader from './DLPHeader'
import CompetencyTracker from './CompetencyTracker'

export default function DLPDocument({
  lessonPlan,
  exportText,
  lessonPlanNarrative,
  lessonPlanTable,
  lessonPlanStruct,
  decisions = [],
  validation = null,
  curriculum = '',
  strand = '',
  outputFormat = 'narrative',
  competencyCodes = [],
  objectives = [],
  warnings = [],
  bloomsLevels = [],
  advisory = '',
  sectionCompleteness = [],
  source = '',
  usedFallback = false,
}){
  const rawHtml = String(lessonPlanTable || lessonPlanNarrative || lessonPlan || exportText || '').trim()
  const structuredPlan = lessonPlanStruct && typeof lessonPlanStruct === 'object' ? lessonPlanStruct : null

  const plan = useMemo(() => {
    const parsedPlan = parseLessonPlanMarkup(rawHtml)
    return mergePlanData(structuredPlan, parsedPlan)
  }, [rawHtml, structuredPlan])

  // If there is no structured plan object but the backend returned raw HTML,
  // render the full HTML blob directly instead of trying to parse individual sections.
  const showRawHtmlFallback = !structuredPlan && rawHtml && /<\/?[a-z][\s\S]*>/i.test(rawHtml)

  const contentRows = [
    ['Topic', plan.content.topic],
    ['Subject', plan.content.subject],
    ['Grade Level', plan.content.grade_level || plan.content.grade],
    ['Quarter', plan.content.quarter],
  ].filter(([, value]) => Boolean(normalizeText(value)))

  const objectiveItems = normalizeItems(plan.objectives)
  const resourceItems = normalizeItems(plan.learningResources)
  const procedureRows = Array.isArray(plan.procedures) ? plan.procedures : []
  const hasHeaderData = Object.values(plan.header || {}).some((value) => Boolean(normalizeText(value)))

  const [decisionsOpen, setDecisionsOpen] = useState(false)
  const [qualityOpen, setQualityOpen] = useState(false)

  return (
    <div className="dlp-output-shell">
      <div>
        {usedFallback && (
          <div className="fallback-warning" style={{marginBottom:12}}>
            <strong>⚠ Note:</strong> The AI did not return a full response. This is a structured template using your form inputs. Please try generating again.
          </div>
        )}
        
        <CompetencyTracker
          curriculum={curriculum}
          competencyCodes={competencyCodes}
          objectives={objectives}
          bloomsLevels={bloomsLevels}
          warnings={warnings}
          sectionCompleteness={sectionCompleteness}
          source={source}
        />

        {showRawHtmlFallback ? (
          <div>
            <div id="dlp-document" className="dlp-document dlp-document--raw" style={{width:'100%', overflowX:'auto', borderRadius:12, overflowY:'visible'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
                <div style={{fontSize:18, fontWeight:700, color:'#0F172A'}}>Lesson Plan</div>
                <div style={{flex:'0 0 auto'}}>
                  <DLPToolbar lessonPlan={lessonPlan} exportText={rawHtml} />
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
            </div>
          </div>
        ) : (
          <div>
          <div id="dlp-document" className="dlp-document dlp-document--structured" style={{width:'100%', overflowX:'auto', borderRadius:12, overflowY:'visible'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <div style={{fontSize:18, fontWeight:700, color:'#0F172A'}}>Lesson Plan</div>
              <div style={{flex:'0 0 auto'}}>
                <DLPToolbar lessonPlan={lessonPlan} exportText={rawHtml} />
              </div>
            </div>
          {hasHeaderData && <DLPHeader data={plan.header} pills={{curriculum, strand, outputFormat, source: mapSourceLabel(source)}} />}

          <SectionCard title="I. Objectives">
            {objectiveItems.length > 0 ? (
              <ul className="dlp-list">
                {objectiveItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <EmptySection />
            )}
          </SectionCard>

          <SectionCard title="II. Content">
            {contentRows.length > 0 ? (
              <table className="dlp-table dlp-section-table">
                <tbody>
                  {contentRows.map(([label, value]) => (
                    <tr key={label}>
                      <td style={{width:'32%'}}><strong>{label}</strong></td>
                      <td>{normalizeText(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptySection />
            )}
          </SectionCard>

          <SectionCard title="III. Learning Resources">
            {resourceItems.length > 0 ? (
              <ul className="dlp-list">
                {resourceItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <EmptySection />
            )}
          </SectionCard>

          <SectionCard title="IV. Learning Procedure">
            {procedureRows.length > 0 ? (
              <table className="dlp-table dlp-section-table">
                <thead>
                  <tr>
                    <th style={{width:'10%'}}>Step</th>
                    <th style={{width:'18%'}}>Time</th>
                    <th style={{width:'36%'}}>Teacher Activity</th>
                    <th>Student Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {procedureRows.map((row, index) => (
                    <tr key={`procedure-${index}`}>
                      <td>{normalizeText(row.step || row[0] || '')}</td>
                      <td>{normalizeText(row.time || row[1] || '')}</td>
                      <td style={{whiteSpace:'pre-wrap'}}>{normalizeBlockText(row.teacher || row[2] || '')}</td>
                      <td style={{whiteSpace:'pre-wrap'}}>{normalizeBlockText(row.student || row[3] || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptySection />
            )}
          </SectionCard>

          <SectionCard title="V. Evaluation">
            {renderTextBlock(plan.evaluation)}
          </SectionCard>

          <SectionCard title="VI. Assignment">
            {renderTextBlock(plan.assignment)}
          </SectionCard>

          <SectionCard title="VII. Remarks">
            {renderTextBlock(plan.remarks)}
          </SectionCard>

          <SectionCard title="VIII. Reflection">
            {renderTextBlock(plan.reflection)}
          </SectionCard>
        </div>
        </div>
        )}

        {/* Post-generation metadata: advisory, decisions, quality check (pills and toolbar moved into header) */}
        <div style={{width:'100%', marginTop:16}}>

          {advisory && (
            <div style={{display:'flex', alignItems:'flex-start', gap:12, background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'12px 14px', color:'#92400E', width:'100%', marginBottom:16}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{flex:'0 0 18px'}}>
                <path d="M12 9v4" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 17h.01" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.29 3.86l-7.39 12.8A2 2 0 0 0 4.69 20h14.62a2 2 0 0 0 1.79-3.34L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#F59E0B" strokeWidth="0" fill="#FFFBEB" />
              </svg>
              <div style={{fontSize:14, lineHeight:1.35}}>{advisory}</div>
            </div>
          )}

          {decisions.length > 0 && (
            <div style={{width:'100%', background:'#FFFFFF', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', borderLeft:'4px solid #22c55e', padding:'0 0 0 0', marginBottom:16}}>
              <button onClick={() => setDecisionsOpen(open => !open)} aria-expanded={decisionsOpen} style={{width:'100%', textAlign:'left', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', border:'none', background:'transparent', cursor:'pointer'}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#E6F9F0" />
                    <path d="M8 12l2.5 2.5L16 9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{fontWeight:700, fontSize:15, color:'#0F172A'}}>AI Decisions Made</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" style={{transform: decisionsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 180ms ease'}}>
                  <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
              {decisionsOpen && (
                <div style={{padding:'0 24px 16px 24px'}}>
                  {decisions.map((decision, index) => (
                    <div key={index} style={{display:'flex', alignItems:'center', gap:12, padding:'7px 0', borderBottom: index === decisions.length - 1 ? 'none' : '1px solid #f3f4f6', color:'#374151', fontSize:13}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{flex:'0 0 16px'}}>
                        <path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div style={{flex:1}}>{decision}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {validation && (
            <div style={{width:'100%', background:'#FFFFFF', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', padding:'0', borderLeft:`4px solid ${validation.score >= validation.total ? '#22c55e' : '#f59e0b'}`}}>
              <button onClick={() => setQualityOpen(open => !open)} aria-expanded={qualityOpen} style={{width:'100%', textAlign:'left', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', border:'none', background:'transparent', cursor:'pointer'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    {validation.score >= validation.total ? (
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#E6F9F0" />
                    ) : (
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#FFFBEB" />
                    )}
                    <path d="M9 12l2 2 4-4" stroke={validation.score >= validation.total ? '#16A34A' : '#D97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{fontSize:14, color:'#0F172A'}}>
                    <strong>DLP Quality Check:</strong>
                    <span style={{marginLeft:8, display:'inline-block', padding:'3px 8px', borderRadius:999, fontSize:12, fontWeight:700, color:'#fff', background: validation.score >= validation.total ? '#16A34A' : '#F59E0B'}}>
                      {validation.score}/{validation.total}
                    </span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" style={{transform: qualityOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 180ms ease'}}>
                  <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
              {qualityOpen && (
                <div style={{padding:'0 20px 16px 20px', color: validation.score < validation.total ? '#B91C1C' : '#166534'}}>
                  {validation.score >= validation.total ? (
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#E6F9F0" />
                        <path d="M9 12l2 2 4-4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div>
                        All required sections were found. <strong style={{marginLeft:8}}>{validation.score}/{validation.total}</strong>
                      </div>
                    </div>
                  ) : Array.isArray(validation.missing) && validation.missing.length > 0 ? (
                    <div>Missing sections to verify: {validation.missing.join(', ')}</div>
                  ) : (
                    <div>No missing sections detected.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function mapSourceLabel(label) {
  if (!label) return ''
  const raw = String(label).trim().toLowerCase()
  if (raw === 'gemini') return 'groq'
  if (raw === 'gemini-fallback') return 'fallback'
  // Map generic display occurrences of the word "gemini" to "AI"
  return String(label).replace(/Gemini/gi, 'AI')
}

function SectionCard({ title, children }) {
  return (
    <table className="dlp-table dlp-section-table">
      <thead>
        <tr>
          <th>{title}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}

function EmptySection() {
  return <div style={{color:'#6B7280', fontStyle:'italic'}}>No data available.</div>
}

function renderTextBlock(value) {
  if (Array.isArray(value)) {
    const items = value.map(normalizeText).filter(Boolean)
    if (items.length === 0) {
      return <EmptySection />
    }

    return <ul className="dlp-list">{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
  }

  const text = normalizeBlockText(value)
  if (!text) {
    return <EmptySection />
  }

  // If the text appears to contain HTML tags (our backend returns HTML with <br> and <strong>),
  // render it as HTML. Otherwise preserve whitespace.
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(text)
  if (looksLikeHtml) {
    return <div dangerouslySetInnerHTML={{ __html: text }} />
  }

  return <div style={{whiteSpace:'pre-wrap'}}>{text}</div>
}

function normalizeBlockText(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[ \f\v]+\n/g, '\n')
    .trim()
}

function normalizeItems(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map(normalizeText)
      .filter(Boolean)
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .flatMap(([key, item]) => {
        const label = normalizeText(key)
        const normalizedItem = normalizeText(item)
        if (!normalizedItem) {
          return []
        }
        return label ? [`${label}: ${normalizedItem}`] : [normalizedItem]
      })
      .filter(Boolean)
  }

  return []
}

function mergePlanData(structuredPlan, parsedPlan) {
  const structured = normalizeStructuredPlan(structuredPlan)

  return {
    header: {
      ...parsedPlan.header,
      ...structured.header,
    },
    content: {
      ...parsedPlan.content,
      ...structured.content,
    },
    objectives: structured.objectives.length > 0 ? structured.objectives : parsedPlan.objectives,
    learningResources: structured.learningResources.length > 0 ? structured.learningResources : parsedPlan.learningResources,
    procedures: structured.procedures.length > 0 ? structured.procedures : parsedPlan.procedures,
    evaluation: pickFirstValue(structured.evaluation, parsedPlan.evaluation),
    assignment: pickFirstValue(structured.assignment, parsedPlan.assignment),
    remarks: pickFirstValue(structured.remarks, parsedPlan.remarks),
    reflection: pickFirstValue(structured.reflection, parsedPlan.reflection),
  }
}

function normalizeStructuredPlan(structuredPlan) {
  if (!structuredPlan || typeof structuredPlan !== 'object') {
    return {
      header: {},
      content: {},
      objectives: [],
      learningResources: [],
      procedures: [],
      evaluation: '',
      assignment: '',
      remarks: '',
      reflection: '',
    }
  }

  const header = structuredPlan.header || structuredPlan.meta || {}
  const content = structuredPlan.content || {}

  return {
    header: {
      school: pickFirstValue(header.school, structuredPlan.school),
      teacher: pickFirstValue(header.teacher, structuredPlan.teacher),
      quarter: pickFirstValue(header.quarter, structuredPlan.quarter),
      date: pickFirstValue(header.date, structuredPlan.date),
      grade_level: pickFirstValue(header.grade_level, structuredPlan.grade_level, structuredPlan.grade),
      learning_area: pickFirstValue(header.learning_area, structuredPlan.learning_area, structuredPlan.subject),
      duration: pickFirstValue(header.duration, structuredPlan.duration),
      section: pickFirstValue(header.section, structuredPlan.section),
    },
    content: {
      topic: pickFirstValue(content.topic, structuredPlan.topic),
      subject: pickFirstValue(content.subject, structuredPlan.subject, structuredPlan.learning_area),
      grade_level: pickFirstValue(content.grade_level, structuredPlan.grade_level, structuredPlan.grade),
      quarter: pickFirstValue(content.quarter, structuredPlan.quarter),
    },
    objectives: normalizeItems(structuredPlan.objectives || structuredPlan.objective),
    learningResources: normalizeItems(structuredPlan.learningResources || structuredPlan.resources),
    procedures: normalizeProcedures(structuredPlan.procedures || structuredPlan.learningProcedure || structuredPlan.procedureRows),
    evaluation: pickFirstValue(structuredPlan.evaluation, structuredPlan.assessment),
    assignment: pickFirstValue(structuredPlan.assignment, structuredPlan.homework),
    remarks: pickFirstValue(structuredPlan.remarks),
    reflection: pickFirstValue(structuredPlan.reflection),
  }
}

function normalizeProcedures(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) {
          return null
        }

        if (Array.isArray(item)) {
          return {
            step: item[0] || '',
            time: item[1] || '',
            teacher: item[2] || '',
            student: item[3] || '',
          }
        }

        if (typeof item === 'object') {
          return {
            step: item.step || item.phase || item.part || '',
            time: item.time || item.duration || '',
            teacher: item.teacher || item.teacherActivity || item.teacher_activity || '',
            student: item.student || item.studentActivity || item.student_activity || '',
          }
        }

        return {
          step: item,
          time: '',
          teacher: '',
          student: '',
        }
      })
      .filter((row) => row && (normalizeText(row.step) || normalizeText(row.teacher) || normalizeText(row.student)))
  }

  return []
}

function parseLessonPlanMarkup(htmlText) {
  const empty = {
    header: {},
    content: {},
    objectives: [],
    learningResources: [],
    procedures: [],
    evaluation: '',
    assignment: '',
    remarks: '',
    reflection: '',
  }

  if (!htmlText || typeof DOMParser === 'undefined' || !/<table/i.test(htmlText)) {
    return empty
  }

  try {
    const parser = new DOMParser()
    const document = parser.parseFromString(htmlText, 'text/html')
    const tables = Array.from(document.querySelectorAll('table'))
    const parsed = { ...empty }

    tables.forEach((table) => {
      const title = getSectionTitle(table)
      const titleKey = title.toUpperCase()
      const rows = extractRows(table)

      if (titleKey.includes('HEADER INFORMATION') || titleKey.includes('DETAILED LESSON PLAN')) {
        parsed.header = {
          ...parsed.header,
          ...parseHeaderRows(table),
        }
        return
      }

      if (titleKey.includes('I. OBJECTIVES')) {
        parsed.objectives = mergeUnique(parsed.objectives, rows.flat())
        return
      }

      if (titleKey.includes('II. CONTENT')) {
        parsed.content = {
          ...parsed.content,
          ...parseKeyValueRows(rows),
        }
        return
      }

      if (titleKey.includes('III. LEARNING RESOURCES')) {
        parsed.learningResources = mergeUnique(parsed.learningResources, rows.flat())
        return
      }

      if (titleKey.includes('IV. LEARNING PROCEDURE') || titleKey.includes('IV. LEARNING PROCEDURES')) {
        parsed.procedures = parsed.procedures.concat(parseProcedureRows(rows))
        return
      }

      if (titleKey.includes('V. EVALUATION')) {
        parsed.evaluation = pickFirstValue(parsed.evaluation, rowsToParagraph(rows))
        return
      }

      if (titleKey.includes('VI. ASSIGNMENT')) {
        parsed.assignment = pickFirstValue(parsed.assignment, rowsToParagraph(rows))
        return
      }

      if (titleKey.includes('VII. REMARKS')) {
        parsed.remarks = pickFirstValue(parsed.remarks, rowsToParagraph(rows))
        return
      }

      if (titleKey.includes('VIII. REFLECTION')) {
        parsed.reflection = pickFirstValue(parsed.reflection, rowsToParagraph(rows))
      }
    })

    return parsed
  } catch {
    return empty
  }
}

function getSectionTitle(table) {
  const headingCell = table.querySelector('th[colspan]') || table.querySelector('thead th') || table.querySelector('caption') || table.querySelector('tr th')
  return normalizeText(headingCell?.textContent || '')
}

function extractRows(table) {
  return Array.from(table.querySelectorAll('tr'))
    .map((row) => Array.from(row.querySelectorAll('th, td')).map((cell) => normalizeText(cell.textContent)).filter(Boolean))
    .filter((cells) => cells.length > 0)
}

function parseHeaderRows(table) {
  const header = {}

  Array.from(table.querySelectorAll('tr')).forEach((row) => {
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length < 2) {
      return
    }

    const left = readPairedField(cells[0])
    const right = readPairedField(cells[1])

    if (left.label) {
      header[normalizeFieldKey(left.label)] = left.value
    }

    if (right.label) {
      header[normalizeFieldKey(right.label)] = right.value
    }
  })

  return header
}

function readPairedField(cell) {
  const label = normalizeText(cell.querySelector('span')?.textContent || '')
  const value = normalizeText(cell.querySelector('strong')?.textContent || '')

  if (label || value) {
    return { label, value }
  }

  const text = normalizeText(cell.textContent)
  return { label: text, value: '' }
}

function normalizeFieldKey(label) {
  const key = normalizeText(label).toLowerCase()

  if (key.includes('school')) return 'school'
  if (key.includes('teacher')) return 'teacher'
  if (key.includes('quarter')) return 'quarter'
  if (key.includes('date')) return 'date'
  if (key.includes('grade')) return 'grade_level'
  if (key.includes('learning area') || key.includes('subject')) return 'learning_area'
  if (key.includes('duration')) return 'duration'
  if (key.includes('section')) return 'section'

  return key.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function parseKeyValueRows(rows) {
  const content = {}

  rows.forEach((row) => {
    if (row.length < 2) {
      return
    }

    const label = normalizeText(row[0])
    const value = normalizeText(row.slice(1).join(' '))
    if (!label || !value) {
      return
    }

    const key = normalizeContentKey(label)
    if (key) {
      content[key] = value
    }
  })

  return content
}

function normalizeContentKey(label) {
  const key = normalizeText(label).toLowerCase()

  if (key.includes('topic')) return 'topic'
  if (key.includes('subject') || key.includes('learning area')) return 'subject'
  if (key.includes('grade')) return 'grade_level'
  if (key.includes('quarter')) return 'quarter'

  return ''
}

function parseProcedureRows(rows) {
  return rows
    .map((row) => {
      if (row.length < 4) {
        return null
      }

      const [step, time, teacher, student] = row
      return {
        step: normalizeText(step),
        time: normalizeText(time),
        teacher: normalizeText(teacher),
        student: normalizeText(student),
      }
    })
    .filter((row) => row && (row.step || row.time || row.teacher || row.student))
}

function rowsToParagraph(rows) {
  return rows
    .map((row) => row.map(normalizeText).filter(Boolean).join(' '))
    .filter(Boolean)
    .join('\n')
}

function mergeUnique(existingItems, newItems) {
  const combined = [...(existingItems || []), ...(newItems || [])]
  return Array.from(new Set(combined.map(normalizeText).filter(Boolean)))
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const text = value.map(normalizeText).filter(Boolean).join('\n')
      if (text) {
        return text
      }
      continue
    }

    const text = normalizeText(value)
    if (text) {
      return text
    }
  }

  return ''
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}
