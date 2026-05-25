import React from 'react'
import LessonForm from '../components/form/LessonForm'
import DLPOutputPanel from '../components/output/DLPOutputPanel'
import { generateLessonPlan, saveToHistory } from '../services/api'
import { saveToSession } from '../services/storage'

export default function GeneratorPage(){
  React.useEffect(() => {
    document.body.classList.add('generate-page-lock')
    return () => document.body.classList.remove('generate-page-lock')
  }, [])

  const [status, setStatus] = React.useState('empty')
  const [generationContext, setGenerationContext] = React.useState(null)
  const [lessonPlan, setLessonPlan] = React.useState(null)
  const [lessonPlanNarrative, setLessonPlanNarrative] = React.useState('')
  const [lessonPlanTable, setLessonPlanTable] = React.useState('')
  const [lessonPlanStruct, setLessonPlanStruct] = React.useState(null)
  const [decisions, setDecisions] = React.useState([])
  const [validation, setValidation] = React.useState(null)
  const [curriculum, setCurriculum] = React.useState('')
  const [strand, setStrand] = React.useState('')
  const [outputFormat, setOutputFormat] = React.useState('narrative')
  const [competencyCodes, setCompetencyCodes] = React.useState([])
  const [objectives, setObjectives] = React.useState([])
  const [warnings, setWarnings] = React.useState([])
  const [bloomsLevels, setBloomsLevels] = React.useState([])
  const [advisory, setAdvisory] = React.useState('')
  const [sectionCompleteness, setSectionCompleteness] = React.useState([])
  const [source, setSource] = React.useState('generated from scratch')
  const [usedFallback, setUsedFallback] = React.useState(false)

  const handleGenerate = async (formData) => {
    setGenerationContext({
      subject: formData.subject || '',
      grade: formData.gradeLevel || formData.grade || '',
      topic: formData.topic || '',
      quarter: formData.quarter || '',
      duration: formData.duration || '',
      difficulty: formData.difficulty || '',
      curriculum: formData.curriculum || '',
      outputFormat: formData.outputFormat || 'narrative',
      source: formData.source || 'generated from scratch',
    })
    setStatus('loading')
    try{
      const resp = await generateLessonPlan(formData)
      const text = resp.data?.lesson_plan || resp.data
      const struct = resp.data?.lesson_plan_struct || null
      const narrativeText = resp.data?.lesson_plan_narrative || text
      const tableText = resp.data?.lesson_plan_table || narrativeText || text
      console.log('lesson_plan content:', resp.data?.lesson_plan)
      console.log('lesson_plan length:', resp.data?.lesson_plan?.length)
      console.log('usedFallback:', resp.data?.usedFallback)
      const generatedDecisions = resp.data?.decisions || []
      const generatedValidation = resp.data?.validation || null
      const generatedCurriculum = resp.data?.curriculum || formData.curriculum || ''
      const generatedStrand = resp.data?.strand || formData.strand || ''
      const generatedFormat = resp.data?.outputFormat || formData.outputFormat || 'narrative'
      const generatedCodes = resp.data?.competencyCodes || formData.competencyCodes || []
      const generatedObjectives = resp.data?.objectives || formData.objectives || []
      const generatedWarnings = resp.data?.warnings || formData.warnings || []
      const generatedBlooms = resp.data?.bloomsLevels || formData.bloomsLevels || []
      const generatedAdvisory = resp.data?.advisory || ''
      const generatedSections = resp.data?.sectionCompleteness || []
        // Normalize to array before storing state
        const normalizedSections = Array.isArray(generatedSections)
          ? generatedSections
          : (generatedSections && typeof generatedSections === 'object')
            ? Object.values(generatedSections)
            : []
      const generatedSource = resp.data?.source || formData.source || 'generated from scratch'
      const usedFallbackFlag = resp.data?.usedFallback || false
      setLessonPlan(text)
      setLessonPlanNarrative(narrativeText)
      setLessonPlanTable(tableText)
      setLessonPlanStruct(struct)
      setDecisions(generatedDecisions)
      setValidation(generatedValidation)
      setCurriculum(generatedCurriculum)
      setStrand(generatedStrand)
      setOutputFormat(generatedFormat)
      setCompetencyCodes(generatedCodes)
      setObjectives(generatedObjectives)
      setWarnings(generatedWarnings)
      setBloomsLevels(generatedBlooms)
      setAdvisory(generatedAdvisory)
        setSectionCompleteness(normalizedSections)
      setSource(generatedSource)
      setUsedFallback(usedFallbackFlag)
        // Attempt to save history but handle failures so UI doesn't crash on network/CORS issues
        const historyData = {
          ...formData,
          lesson_plan: text,
          lesson_plan_narrative: narrativeText,
          lesson_plan_table: tableText,
          lesson_plan_struct: struct,
          decisions: generatedDecisions,
          validation: generatedValidation,
          curriculum: generatedCurriculum,
          strand: generatedStrand,
          outputFormat: generatedFormat,
          competencyCodes: generatedCodes,
          objectives: generatedObjectives,
          warnings: generatedWarnings,
          bloomsLevels: generatedBlooms,
          advisory: generatedAdvisory,
          sectionCompleteness: normalizedSections,
          source: generatedSource,
          usedFallback: usedFallbackFlag,
        }
        
        // Always save to session storage
        saveToSession(historyData)
        
        // Try to save to API
        saveToHistory(historyData).catch(err => {
          console.warn('saveToHistory failed', err)
        })
      setStatus('generated')
    }catch(e){
      console.error(e)
      setStatus('empty')
    }
  }

  return (
    <div className="generate-shell" style={{height:'calc(100vh - 76px - 64px)', display:'flex', gap:18, overflow:'hidden', padding:'18px 18px 18px 18px', boxSizing:'border-box'}}>
      <aside className="lesson-form generate-panel generate-panel--form" style={{width:310, flexShrink:0, height:'100%', overflow:'hidden', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:12, boxSizing:'border-box'}}>
        <div className="generate-panel-scroll generate-panel-scroll--form" style={{height:'100%', overflowY:'auto', padding:12}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10}}>
            <span style={{fontSize:12, color:'#64748B'}}>≡</span>
            <h2 style={{margin:0, fontSize:12, fontWeight:600, color:'#0F172A'}}>Lesson Parameters</h2>
          </div>
          <LessonForm onSubmit={handleGenerate} loading={status==='loading'} />
          <p style={{fontSize:10, color:'#94A3B8', textAlign:'center', marginTop:12}}>Need help? Check the sample DLL for recommended templates and formats.</p>
        </div>
      </aside>

      <section className="generate-panel generate-panel--workspace" style={{flex:1, minWidth:0, height:'100%', overflow:'hidden', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:12, boxSizing:'border-box'}}>
        <div className="generate-panel-scroll generate-panel-scroll--workspace" style={{height:'100%', overflowY:'auto', background:'#F8F8F5', padding:'8px 20px 20px'}}>
          <DLPOutputPanel
            status={status}
            lessonPlan={lessonPlan}
            lessonPlanNarrative={lessonPlanNarrative}
            lessonPlanTable={lessonPlanTable}
            lessonPlanStruct={lessonPlanStruct}
            generationContext={generationContext}
            decisions={decisions}
            validation={validation}
            curriculum={curriculum}
            strand={strand}
            outputFormat={outputFormat}
            competencyCodes={competencyCodes}
            objectives={objectives}
            warnings={warnings}
            bloomsLevels={bloomsLevels}
            advisory={advisory}
            sectionCompleteness={sectionCompleteness}
            source={source}
            usedFallback={usedFallback}
          />
        </div>
      </section>
    </div>
  )
}
