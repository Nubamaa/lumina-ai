import React from 'react'
import SubjectInput from './SubjectInput'
import GradeLevelSelect from './GradeLevelSelect'
import TopicInput from './TopicInput'
import QuarterSelect from './QuarterSelect'
import DurationSelect from './DurationSelect'
import DifficultyToggle from './DifficultyToggle'
import SpecialNotesTextarea from './SpecialNotesTextarea'
import { extractLessonPlan } from '../../services/api'

const CURRICULUM_OPTIONS = [
  'K-12 MELCs (DepEd Order No. 12, s. 2020)',
  'MATATAG Curriculum (DepEd Order No. 10, s. 2024)',
  'SHS Core + Applied/Specialized (DepEd Order No. 21, s. 2019)',
  'Alternative Learning System / ALS (DepEd Order No. 3, s. 2021)',
  'Indigenous Peoples Education / IPED (DepEd Order No. 62, s. 2011)',
]

const EMPTY_INITIAL_VALUES = Object.freeze({})

function buildAdvisory(grade, curriculum) {
  if ((curriculum || '').toLowerCase().includes('matatag')) return ''
  const match = String(grade || '').match(/\d+/)
  const gradeNum = match ? Number(match[0]) : 0
  if (gradeNum >= 4) {
    return 'Advisory: Grade 4 transitions to MATATAG in SY2024-25. This plan currently uses MELCs.'
  }
  return ''
}

const defaultForm = {
  subject: '',
  grade: '',
  topic: '',
  quarter: '1',
  duration: '45 Minutes',
  difficulty: 'Basic',
  lessonPlanType: 'D-DLP',
  specialNotes: '',
  curriculum: 'K-12 MELCs (DepEd Order No. 12, s. 2020)',
  outputFormat: 'table',
  source: 'generated from scratch',
}

export default function LessonForm({onSubmit, loading, initialValues, onChange}){
  const [form, setForm] = React.useState({...defaultForm, ...initialValues})
  const [uploadFile, setUploadFile] = React.useState(null)
  const [extracting, setExtracting] = React.useState(false)
  const [extractionSummary, setExtractionSummary] = React.useState(null)
  const [errors, setErrors] = React.useState({})
  const onChangeRef = React.useRef(onChange)
  const initialValuesSignature = JSON.stringify(initialValues ?? EMPTY_INITIAL_VALUES)

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  React.useEffect(() => {
    setForm(prev => {
      const next = {...prev, ...(initialValues ?? EMPTY_INITIAL_VALUES)}
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
    })
  }, [initialValuesSignature])

  React.useEffect(() => {
    onChangeRef.current?.(form)
  }, [form])

  const updateField = (key, value) => {
    setForm(prev => ({...prev, [key]: value}))
    if (key === 'subject' || key === 'topic') {
      setErrors(prev => ({ ...prev, [key]: '' }))
    }
  }

  const handleExtract = async (event) => {
    event.preventDefault()
    if (!uploadFile) return
    setExtracting(true)
    try {
      const response = await extractLessonPlan(uploadFile)
      const data = response.data || {}
      setExtractionSummary(data)
      setForm(prev => ({
        ...prev,
        subject: data.subject || prev.subject,
        grade: data.gradeLevel || prev.grade,
        topic: data.topic || prev.topic,
        quarter: data.quarter || prev.quarter,
        duration: data.duration || prev.duration,
        curriculum: data.curriculum || prev.curriculum,
        specialNotes: prev.specialNotes,
        source: 'uploaded file',
      }))
    } catch (error) {
      console.warn(error)
    } finally {
      setExtracting(false)
    }
  }

  const advisory = buildAdvisory(form.grade, form.curriculum)
  const handleSubmit = (e)=>{
    e.preventDefault()
    // Validate required fields
    const newErrors = {}
    if (!form.subject || !form.subject.trim()) newErrors.subject = 'Please enter a Learning Area / Subject.'
    if (!form.grade || form.grade === 'Select grade level') newErrors.grade = 'Please select a Grade Level.'
    if (!form.topic || !form.topic.trim()) newErrors.topic = 'Please enter a Topic.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    onSubmit({
      subject: form.subject.trim(),
      gradeLevel: form.grade,
      grade: form.grade,
      topic: form.topic.trim(),
      quarter: form.quarter,
      duration: form.duration,
      difficulty: form.difficulty,
      lessonPlanType: form.lessonPlanType,
      specialNotes: form.specialNotes,
      special_notes: form.specialNotes,
      curriculum: form.curriculum,
      outputFormat: form.outputFormat,
      source: form.source,
      competencyCodes: extractionSummary?.competencyCodes || [],
      warnings: extractionSummary?.warnings || [],
      objectives: extractionSummary?.objectives || [],
      bloomsLevels: extractionSummary?.bloomsLevels || [],
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{fontSize:12}}>
      <SubjectInput value={form.subject} onChange={value => updateField('subject', value)} />
      <GradeLevelSelect value={form.grade} onChange={value => updateField('grade', value)} />
      <div style={{marginBottom:8}}>
        <label>Curriculum Framework</label>
        <select value={form.curriculum} onChange={e => updateField('curriculum', e.target.value)} style={{width:'100%',height:34,padding:'6px 10px',borderRadius:8,border:'1px solid #E2E8F0',fontSize:12}}>
          {CURRICULUM_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <div style={{fontSize:9, color:'#94A3B8', fontStyle:'italic', marginTop:4}}>
          Enter the DepEd curriculum framework or MELC code for this lesson.
        </div>
      </div>
      <TopicInput value={form.topic} onChange={value => updateField('topic', value)} />
      <QuarterSelect value={form.quarter} onChange={value => updateField('quarter', value)} />
      <DurationSelect value={form.duration} onChange={value => updateField('duration', value)} />
      <DifficultyToggle value={form.difficulty} onChange={value => updateField('difficulty', value)} />
      <div style={{marginBottom:8}}>
        <label>Lesson Plan Type</label>
        <div style={{display:'grid', gap:5, marginTop:5}}>
          {[
            ['D-DLP', 'Detailed Lesson Plan'],
            ['S-DLP', 'Semi-Detailed Lesson Plan'],
          ].map(([value, label]) => (
            <label key={value} style={{display:'flex', alignItems:'center', gap:6, border:'1px solid #E5E7EB', borderRadius:8, padding:'5px 8px', fontSize:12}}>
              <input type="radio" name="lessonPlanType" value={value} checked={form.lessonPlanType === value} onChange={e => updateField('lessonPlanType', e.target.value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{marginBottom:8}}>
        <label>Output Format</label>
        <div style={{display:'grid', gap:5, marginTop:5}}>
          {[
            ['narrative', 'Narrative'],
            ['table', 'Table'],
            ['both', 'Both'],
          ].map(([value, label]) => (
            <label key={value} style={{display:'flex', alignItems:'center', gap:6, border:'1px solid #E5E7EB', borderRadius:8, padding:'5px 8px', fontSize:12}}>
              <input type="radio" name="outputFormat" value={value} checked={form.outputFormat === value} onChange={e => updateField('outputFormat', e.target.value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <details style={{marginBottom:8}}>
        <summary style={{cursor:'pointer', fontWeight:600}}>Upload Existing Lesson Plan (optional)</summary>
        <div style={{marginTop:8, display:'grid', gap:7}}>
          <label style={{display:'block'}}>Upload Existing Lesson Plan (optional)</label>
          <input type="file" accept=".pdf,.docx,.txt" onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{width:'100%',padding:'5px',borderRadius:8,border:'1px dashed #CBD5E1',height:32,fontSize:11}} />
          <div style={{fontSize:10,color:'#94A3B8'}}>Upload a .docx or .pdf to use as reference or base for generation.</div>
          <div style={{display:'flex', gap:8}}>
            <button type="button" onClick={handleExtract} disabled={!uploadFile || extracting} style={{padding:'6px 10px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:11}}>
              {extracting ? 'Extracting…' : 'Extract Lesson Metadata'}
            </button>
            {uploadFile && <span style={{alignSelf:'center', fontSize:11, color:'#6B7280'}}>{uploadFile.name}</span>}
          </div>
          {extracting && <div style={{fontSize:12, color:'#1E2A45'}}>Extracting text and lesson metadata...</div>}
          {extractionSummary && (
            <div style={{border:'1px solid #D1FAE5', background:'#F0FDF4', borderRadius:12, padding:10}}>
              <div style={{fontWeight:700, color:'#166534', marginBottom:6, fontSize:12}}>Extraction Summary</div>
              <div style={{display:'grid', gap:5, fontSize:12, color:'#14532D'}}>
                <div><strong>Subject:</strong> {extractionSummary.subject || 'Not detected'}</div>
                <div><strong>Grade:</strong> {extractionSummary.gradeLevel || 'Not detected'}</div>
                <div><strong>Topic:</strong> {extractionSummary.topic || 'Not detected'}</div>
                <div><strong>Curriculum:</strong> {extractionSummary.curriculum || 'Not detected'}</div>
              </div>
              {Array.isArray(extractionSummary.competencyCodes) && extractionSummary.competencyCodes.length > 0 && (
                <div style={{marginTop:8, display:'flex', flexWrap:'wrap', gap:6}}>
                  {extractionSummary.competencyCodes.map(code => (
                    <span key={code} style={{padding:'3px 7px', background:'#DCFCE7', borderRadius:999, fontSize:11, color:'#166534'}}>{code}</span>
                  ))}
                </div>
              )}
              {Array.isArray(extractionSummary.warnings) && extractionSummary.warnings.length > 0 && (
                <ul style={{margin:'8px 0 0', paddingLeft:18, color:'#B45309', fontSize:11}}>
                  {extractionSummary.warnings.slice(0, 4).map((warning, index) => <li key={index}>{warning}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </details>

      <SpecialNotesTextarea value={form.specialNotes} onChange={value => updateField('specialNotes', value)} />

      {advisory && (
        <div style={{marginBottom:8, padding:10, borderRadius:10, background:'#FFFBEB', border:'1px solid #FCD34D', color:'#92400E', fontSize:12}}>
          ⚠ {advisory}
        </div>
      )}

      <div style={{marginTop:8}}>
        {errors.subject && <div style={{color:'#B91C1C', marginBottom:6, fontSize:11}}>{errors.subject}</div>}
          {errors.grade && <div style={{color:'#B91C1C', marginBottom:6, fontSize:11}}>{errors.grade}</div>}
        {errors.topic && <div style={{color:'#B91C1C', marginBottom:6, fontSize:11}}>{errors.topic}</div>}
        <button type="submit" disabled={loading} style={{width:'100%',height:38,borderRadius:8,border:'none',background:'#F59E0B',color:'#FFFFFF',fontSize:12,fontWeight:600,cursor:'pointer'}}>
          {loading ? 'Generating…' : 'Generate Lesson Plan'}
        </button>
      </div>
    </form>
  )
}
