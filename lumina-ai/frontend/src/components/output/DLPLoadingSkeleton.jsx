import React from 'react'

const STEP_DELAY_MS = 360
const EXIT_DELAY_MS = 360

function normalizeGradeLabel(value) {
  const grade = String(value || '').trim()
  if (!grade) return 'Grade 2'
  return grade.toLowerCase().startsWith('grade') ? grade : `Grade ${grade}`
}

function normalizeQuarterLabel(value) {
  const quarter = String(value || '').trim()
  if (!quarter) return '1st Quarter'
  if (/^\d+$/.test(quarter)) {
    const numeric = Number(quarter)
    const suffix = numeric === 1 ? 'st' : numeric === 2 ? 'nd' : numeric === 3 ? 'rd' : 'th'
    return `${numeric}${suffix} Quarter`
  }
  if (/^\d+(st|nd|rd|th)\s+Quarter$/i.test(quarter)) {
    return quarter.replace(/^\d+(st|nd|rd|th)/i, match => match.toLowerCase())
  }
  return quarter
}

function normalizeTitleLabel(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function buildDecisionSteps(context = {}) {
  const grade = normalizeGradeLabel(context.grade)
  const subject = normalizeTitleLabel(context.subject || 'Science') || 'Science'
  const topic = String(context.topic || 'Planets').trim() || 'Planets'
  const quarter = normalizeQuarterLabel(context.quarter || '1st Quarter')
  const difficulty = String(context.difficulty || 'Basic').trim() || 'Basic'
  const duration = String(context.duration || '45 Minutes').trim() || '45 Minutes'
  const curriculum = String(context.curriculum || 'K-12 MELCs (DepEd Order No. 12, s. 2020)').trim() || 'K-12 MELCs (DepEd Order No. 12, s. 2020)'
  const outputFormat = normalizeTitleLabel(context.outputFormat || 'Table') || 'Table'
  const source = String(context.source || 'generated from scratch').trim() || 'generated from scratch'

  const primaryGrade = /Grade\s*([1-3])/i.test(grade)
  const gradeText = primaryGrade ? `Primary grade detected (${grade})` : `Grade level detected (${grade})`
  const scaffoldingText = difficulty.toLowerCase() === 'basic'
    ? 'Used simple vocabulary and scaffolded objectives'
    : 'Adjusted language and task complexity to match the selected level'

  return [
    {
      id: 'grade',
      pending: 'Detecting grade level',
      complete: `${gradeText} → ${scaffoldingText}`,
    },
    {
      id: 'subject',
      pending: 'Identifying subject area',
      complete: `Subject area scoped to ${subject} standards and competencies`,
    },
    {
      id: 'topic',
      pending: 'Centering topic',
      complete: `Topic "${topic}" applied to all objectives and assessments`,
    },
    {
      id: 'quarter',
      pending: 'Framing quarter',
      complete: `${quarter} pacing and references applied`,
    },
    {
      id: 'difficulty',
      pending: 'Applying difficulty level',
      complete: `${difficulty} difficulty → Heavy scaffolding and simplified language added`,
    },
    {
      id: 'duration',
      pending: 'Allocating time',
      complete: `${duration} → All 10 procedure steps time-allocated`,
    },
    {
      id: 'curriculum',
      pending: 'Aligning curriculum',
      complete: `Aligned to ${curriculum}`,
    },
    {
      id: 'format',
      pending: 'Setting output format',
      complete: `${outputFormat} format selected`,
    },
    {
      id: 'source',
      pending: 'Building lesson plan',
      complete: (() => {
        const s = source.trim().toLowerCase()
        if (s === 'generated from scratch') return 'Generating from scratch'
        if (s === 'gemini') return 'groq'
        if (s === 'gemini-fallback') return 'fallback'
        return normalizeTitleLabel(source.replace(/Gemini/gi, 'AI'))
      })(),
    },
  ]
}

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <span style={{ color: '#22c55e', width: 18, flex: '0 0 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
 
  return (
    <span style={{ color: '#94A3B8', width: 18, flex: '0 0 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    </span>
  )
}

export default function DLPLoadingSkeleton({
  active = false,
  generationContext = null,
  onDismiss,
}){
  // When not active, do not render at all (parent may still render but we must unmount immediately)
  if (!active) return null
  const steps = React.useMemo(() => buildDecisionSteps(generationContext), [generationContext])
  const [stepStates, setStepStates] = React.useState(() => steps.map(() => 'pending'))
  const [sequenceDone, setSequenceDone] = React.useState(false)
  const [isExiting, setIsExiting] = React.useState(false)
  const [thinkingDots, setThinkingDots] = React.useState(0)

  React.useEffect(() => {
    setStepStates(steps.map((_, index) => (index === 0 ? 'active' : 'pending')))
    setSequenceDone(false)
    setIsExiting(false)
    setThinkingDots(0)

    const timers = []
    const advanceStep = (index) => {
      if (index >= steps.length) {
        timers.push(setTimeout(() => {
          setStepStates(steps.map(() => 'done'))
          setSequenceDone(true)
        }, STEP_DELAY_MS))
        return
      }

      setStepStates(steps.map((_, stepIndex) => {
        if (stepIndex < index) return 'done'
        if (stepIndex === index) return 'active'
        return 'pending'
      }))

      timers.push(setTimeout(() => advanceStep(index + 1), STEP_DELAY_MS))
    }

    advanceStep(0)

    timers.push(setInterval(() => {
      setThinkingDots(current => (current + 1) % 4)
    }, 420))

    return () => {
      timers.forEach(clearTimeout)
      timers.forEach(clearInterval)
    }
  }, [steps])

  React.useEffect(() => {
    if (active || !sequenceDone) return

    setIsExiting(true)
    const timer = setTimeout(() => {
      onDismiss?.()
    }, EXIT_DELAY_MS)

    return () => clearTimeout(timer)
  }, [active, sequenceDone, onDismiss])

  const visibleSteps = stepStates
    .map((state, index) => ({ state, ...steps[index] }))
    .filter(step => step.state !== 'pending')
  const isFinalizing = active && sequenceDone
  const styles = {
    card: {
      width: '100%',
      minHeight: 'auto',
      overflowY: 'auto',
      scrollbarWidth: 'none',
      background: '#FFFFFF',
      borderRadius: 12,
      boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
      padding: '16px 20px',
      border: '1px solid rgba(15,23,42,0.06)'
    },
    headerInner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12
    },
    eyebrow: { fontSize: 15, fontWeight: 800, color: '#0F172A' },
    title: { marginTop: 4, fontSize: 13, color: '#64748B', marginBottom: 12 },
    badge: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 },
    steps: { display: 'flex', flexDirection: 'column', gap: 8 },
    step: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' },
    stepBody: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
    stepText: { color: '#0F172A', fontSize: 14, lineHeight: 1.4, fontWeight: 600 },
    stepSubtext: { color: '#64748B', fontSize: 12, lineHeight: 1.35 },
    finalizingText: { fontStyle: 'italic', color: '#64748B', fontSize: 12 }
  }

  return (
    <div className={`ai-thinking-panel${active ? ' ai-thinking-panel--flow' : ' ai-thinking-panel--overlay'}${isExiting ? ' ai-thinking-panel--exit' : ''}`}>
      <div className="ai-thinking-panel__card" style={styles.card}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.eyebrow}>Lumina AI is thinking...</div>
            <div style={styles.title}>Building a classroom-ready lesson plan</div>
          </div>
          <div style={styles.badge}>Live decision log</div>
        </div>

        <div style={styles.steps}>
          {(() => {
            const totalRows = visibleSteps.length + (isFinalizing ? 1 : 0)
            return visibleSteps.map((step, idx) => {
              const isLastRow = idx === totalRows - 1
              const rowStyle = { ...styles.step, borderBottom: isLastRow ? 'none' : '1px solid #f0f0f0' }
              return (
                <div key={step.id} style={rowStyle}>
                  <StepIcon state={step.state} />
                  <div style={styles.stepBody}>
                    <div style={styles.stepText}>
                      {step.state === 'active' ? step.pending : step.complete}
                    </div>
                    {step.state === 'active' && (
                      <div style={styles.stepSubtext}>Checking curriculum fit, structure, and pacing</div>
                    )}
                  </div>
                </div>
              )
            })
          })()}

          {isFinalizing && (() => {
            const finalIndex = visibleSteps.length
            const totalRows = visibleSteps.length + 1
            const isLast = finalIndex === totalRows - 1
            return (
              <div style={{ ...styles.step, borderBottom: isLast ? 'none' : '1px solid #f0f0f0' }}>
                <StepIcon state="active" />
                <div style={styles.stepBody}>
                  <div style={styles.finalizingText}>Finalizing response{'.'.repeat(thinkingDots)}</div>
                  <div style={styles.finalizingText}>AI is returning the finished lesson plan</div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
