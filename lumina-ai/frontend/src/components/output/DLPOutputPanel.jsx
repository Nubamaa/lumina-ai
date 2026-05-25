import React from 'react'
import DLPEmptyState from './DLPEmptyState'
import DLPLoadingSkeleton from './DLPLoadingSkeleton'
import DLPDocument from './DLPDocument'

export default function DLPOutputPanel({
  status,
  lessonPlan,
  lessonPlanNarrative,
  lessonPlanTable,
  lessonPlanStruct,
  generationContext = null,
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
  const [showThinkingPanel, setShowThinkingPanel] = React.useState(status === 'loading')

  React.useEffect(() => {
    if (status === 'loading') {
      setShowThinkingPanel(true)
      return
    }

    if (status === 'empty') {
      setShowThinkingPanel(false)
    }
  }, [status])

  if(status === 'empty') return <DLPEmptyState />
  return (
    <div className="dlp-output-shell dlp-output-shell--workspace" style={{position:'relative', minHeight:'100%'}}>
      {status !== 'loading' && (
        <div style={{transition:'opacity 320ms ease, transform 320ms ease', opacity:1, transform:'translateY(0)'}}>
          <DLPDocument
            lessonPlan={lessonPlan}
            exportText={outputFormat === 'both'
              ? [lessonPlanNarrative, lessonPlanTable].filter(Boolean).join('\n\n')
              : (lessonPlan || lessonPlanNarrative || lessonPlanTable || '')}
            lessonPlanNarrative={lessonPlanNarrative}
            lessonPlanTable={lessonPlanTable}
            lessonPlanStruct={lessonPlanStruct}
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
      )}

      {status === 'loading' && (
        <DLPLoadingSkeleton
          active
          generationContext={generationContext}
          onDismiss={() => setShowThinkingPanel(false)}
        />
      )}

      {status !== 'loading' && showThinkingPanel && (
        <DLPLoadingSkeleton
          active={false}
          generationContext={generationContext}
          onDismiss={() => setShowThinkingPanel(false)}
        />
      )}
    </div>
  )
}
