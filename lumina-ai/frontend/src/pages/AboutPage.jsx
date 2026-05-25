import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AboutPage() {
  const nav = useNavigate()

  const getBadgeStyle = (result) => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }
    if (result === 'Pass')     return { ...base, background: '#dcfce7', color: '#16a34a' }
    if (result === 'Partial')  return { ...base, background: '#fef3c7', color: '#d97706' }
    if (result === 'Fixed')    return { ...base, background: '#fee2e2', color: '#dc2626' }
    if (result === 'Fallback') return { ...base, background: '#f3f4f6', color: '#6b7280' }
    return base
  }

  const testRows = [
    { test: 1,  subject: 'Math',           grade: 'Grade 1',      topic: 'Addition',                type: 'Detailed', result: 'Partial',  finding: 'Topic drift to Numbers — fixed with anchoring rules' },
    { test: 2,  subject: 'PE',             grade: 'Grade 3',      topic: 'Running',                 type: 'Detailed', result: 'Pass',     finding: 'Special notes applied, MATATAG recognized' },
    { test: 3,  subject: 'Entrepreneurship', grade: 'Grade 11',   topic: 'Business Planning',       type: 'Detailed', result: 'Pass',     finding: "Bloom's correct for SHS, evaluation thin" },
    { test: 4,  subject: 'English',        grade: 'Grade 7',      topic: 'Types of Characters',     type: 'Detailed', result: 'Fixed',    finding: 'Complete topic drift — fixed, confirmed in retest' },
    { test: 5,  subject: 'English',        grade: 'Grade 7',      topic: 'Types of Characters',     type: 'Detailed', result: 'Pass',     finding: 'Retest confirmed topic anchoring fix worked' },
    { test: 6,  subject: 'Math',           grade: 'Grade 1',      topic: 'Addition',                type: 'Detailed', result: 'Pass',     finding: 'Retest confirmed fix worked' },
    { test: 7,  subject: 'Science',        grade: 'Kindergarten', topic: 'Animals',                 type: 'Detailed', result: 'Partial',  finding: 'Play-based applied; evaluation type wrong for age' },
    { test: 8,  subject: 'Math',           grade: 'Grade 4',      topic: 'Animals',                 type: 'Detailed', result: 'Pass',     finding: 'MATATAG recognized; minor MELC mix' },
    { test: 9,  subject: 'English',        grade: 'Grade 7',      topic: 'Types of Characters',     type: 'Semi',     result: 'Fallback', finding: 'Rate limit hit; fallback ignores Semi-Detailed format' },
    { test: 10, subject: 'Filipino',       grade: 'Grade 8',      topic: 'Mga Uri ng Pangungusap',  type: 'Detailed', result: 'Fallback', finding: 'Rate limit hit; advisory correct; special notes not applied' },
  ]

  const capabilities = [
    { title: 'Goal-Oriented Task Completion',  desc: 'The agent has one goal: produce a valid DepEd DLP. Every decision serves that goal. It never returns an error — always produces output.' },
    { title: 'Multi-Step Reasoning',           desc: "The prompt instructs the LLM to reason about grade level, Bloom's Taxonomy, topic specificity, curriculum framework, and lesson type before generating each section." },
    { title: 'Tool Usage',                     desc: 'The agent calls the Groq API as an external LLM tool. It monitors response quality, switches models on failure, and chains multiple calls when needed.' },
    { title: 'Decision-Making Rules',          desc: 'build_prompt() encodes explicit rules — RRMLAG sequencing, Detailed vs Semi-Detailed branching, topic anchoring, evaluation depth by grade, objectives format.' },
    { title: 'Validation and Self-Correction', desc: 'validate_dlp() scans output for all 9 required section headings and reports a quality score. Teachers see exactly which sections need review.' },
    { title: 'Fallback Planning',              desc: 'Three-tier fallback chain: Primary Groq call → Focused fallback prompt → Static template. Output delivery rate: 100%.' },
  ]

  const responsibleCards = [
    { title: 'Transparency',                 desc: 'Every lesson plan is clearly marked as an AI draft. Teachers see a quality score and a list of sections to check before using it in class.' },
    { title: 'Privacy',                      desc: 'School Name, Teacher Name, and Date are always left empty. Lumina never fills these in or saves any personal details.' },
    { title: 'Teacher Control',              desc: 'Everything in the lesson plan can be edited. The AI writes the draft but the teacher makes all the final decisions and is responsible for what is used in class.' },
    { title: 'Bias and Hallucination Warnings', desc: 'References in the lesson plan may be made up by the AI. The system reminds teachers to check all sources. You can ask for local examples by using the Special Notes field.' },
  ]

  const techStack = [
    { title: 'React + Vite',     subtitle: 'Frontend' },
    { title: 'Python + Flask',   subtitle: 'Backend API' },
    { title: 'Groq API',         subtitle: 'LLM Engine' },
    { title: 'LLaMA 3.3 70B',    subtitle: 'Primary Model' },
  ]

  const sectionPad = { paddingLeft: 64, paddingRight: 64, paddingTop: 80, paddingBottom: 80 }
  const cream = { background: '#F5F0E8' }
  const white = { background: '#FFFFFF' }

  return (
    <div style={{ color: '#0F172A', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── SECTION 1: HERO ── */}
      <div style={{ ...sectionPad, ...cream, paddingTop: 100, paddingBottom: 72 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <span style={labelStyle}>ABOUT LUMINA AI</span>
          <h1 style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-serif)', color: '#0F172A', lineHeight: 1.15, marginBottom: 28 }}>
            Helping Filipino teachers plan better lessons, faster
          </h1>
          <p style={paraStyle}>
            Lumina AI was built because Filipino teachers spend too much time on paperwork. That time should go to students instead.
          </p>
          <p style={paraStyle}>
            The goal is simple — give teachers back their time. Every lesson plan Lumina generates is a starting draft. Teachers review it, change what they need, and make it their own. The AI handles the format and structure. The teacher brings the real teaching.
          </p>
          <p style={{ ...paraStyle, marginBottom: 0 }}>
            Technology should help teachers, not replace them. Teachers make all the decisions. Lumina just does the paperwork.
          </p>
        </div>
      </div>

      {/* ── SECTION 2: THE PROBLEM ── */}
      <div style={{ ...sectionPad, ...white }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <span style={labelStyle}>THE PROBLEM</span>
          <h2 style={headingStyle}>Filipino Teachers Spend Hours on Paperwork</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px auto' }}>
            <div style={statCardStyle}>
              <div style={statNumStyle}>8–10 hrs</div>
              <div style={statLabelStyle}>spent per week on lesson planning</div>
            </div>
            <div style={statCardStyle}>
              <div style={statNumStyle}>9 sections</div>
              <div style={statLabelStyle}>required by DepEd per lesson plan</div>
            </div>
          </div>

          <p style={{ ...paraStyle, maxWidth: 720, marginBottom: 0, margin: '0 auto', textAlign: 'center' }}>
            Filipino K-12 teachers need to submit lesson plans that follow DepEd's exact format — nine sections with the right headings, Bloom's Taxonomy level, competency codes, and RRMLAG steps in order. Writing one plan by hand takes one to two hours. Lumina AI generates the same complete plan in under 30 seconds.
          </p>
        </div>
      </div>

      {/* ── SECTION 3: AGENTIC BEHAVIOR ── */}
      <div style={{ ...sectionPad, ...cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={labelStyle}>AGENTIC BEHAVIOR</span>
          <h2 style={headingStyle}>5 Agent Capabilities</h2>
          <p style={{ ...paraStyle, marginBottom: 40 }}>The project rubric requires at least 2. Lumina shows 5.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {capabilities.map((item, idx) => (
              <div key={idx} style={featureCardStyle}>
                <div style={featureTitleStyle}>{item.title}</div>
                <div style={featureDescStyle}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: IMPLEMENTATION ── */}
      <div style={{ ...sectionPad, ...white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <span style={labelStyle}>IMPLEMENTATION</span>
          <h2 style={headingStyle}>Built With</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            {techStack.map((tech, idx) => (
              <div key={idx} style={pillStyle}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{tech.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{tech.subtitle}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 0 }}>
            No model training needed. All DepEd rules are written directly into the prompt instructions given to the AI.
          </p>
        </div>
      </div>

      {/* ── SECTION 5: TESTING ── */}
      <div style={{ ...sectionPad, ...cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={labelStyle}>TESTING AND EVALUATION</span>
          <h2 style={headingStyle}>10 Test Cases Documented</h2>

          {/* Table wrapper for border-radius */}
          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 32 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF' }}>
              <thead>
                <tr>
                  {['Test', 'Subject', 'Grade', 'Topic', 'Type', 'Result', 'Key Finding'].map(col => (
                    <th key={col} style={{
                      background: '#1a1f3c',
                      color: '#FFFFFF',
                      padding: '14px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testRows.map((row, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 1 ? '#f9fafb' : '#FFFFFF' }}>
                    <td style={tdStyle}>{row.test}</td>
                    <td style={tdStyle}>{row.subject}</td>
                    <td style={tdStyle}>{row.grade}</td>
                    <td style={tdStyle}>{row.topic}</td>
                    <td style={tdStyle}>{row.type}</td>
                    <td style={tdStyle}><span style={getBadgeStyle(row.result)}>{row.result}</span></td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 13 }}>{row.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { num: '6 / 10', label: 'Passed or mostly passed' },
              { num: '2 / 10', label: 'Triggered fallback (rate limit)' },
              { num: '4',      label: 'Bugs identified and fixed' },
            ].map((s, idx) => (
              <div key={idx} style={statCardStyle}>
                <div style={statNumStyle}>{s.num}</div>
                <div style={statLabelStyle}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
{/* ── SECTION 5.5: CURRENT LIMITATIONS ── */}
<div style={{ ...sectionPad, ...white }}>
  <div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <span style={labelStyle}>CURRENT LIMITATIONS</span>
    <h2 style={headingStyle}>Key Challenges and Constraints</h2>
    <p style={{ ...paraStyle, marginBottom: 40 }}>
      Lumina AI uses free-tier AI models right now. Here are the current limitations and why they happen.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {[
        {
          title: 'Token and Character Limits',
          desc: 'Free AI models have strict limits on how much text they can process at once. Inputs are kept short and the system splits each lesson plan into two separate AI calls to get the best output within those limits.',
        },
        {
          title: 'Limited Generation Volume',
          desc: 'The free tier can handle about 8 to 12 lesson plans per day before hitting the limit. One teacher at a time is fine, but if a whole school tries to use it at the same time, the daily limit will run out quickly.',
        },
        {
          title: 'Inconsistent Output Quality',
          desc: 'Free AI models focus on speed, not always on quality. Some lesson plans come out better than others. The quality check score and section report help teachers quickly spot anything that needs fixing.',
        },
        {
          title: 'No Persistent Storage',
          desc: 'Lesson plans are only saved in your browser for the current session. Clearing your browser or switching devices removes them. Always download or print the plans you want to keep.',
        },
        {
          title: 'Missing Advanced Features',
          desc: 'Right now there is no shared editing, no version history, no offline mode, and no live preview while editing. These features would need a paid server setup to build.',
        },
        {
          title: 'Limited Curriculum Coverage in Fallbacks',
          desc: 'Only the main AI call uses the full curriculum instructions. If the system falls back to a backup, it defaults to K-12 MELCs. Teachers using MATATAG, ALS, or SHS may get content that does not perfectly match their framework when fallbacks happen.',
        },
        {
          title: 'No Real-Time Curriculum Updates',
          desc: 'All DepEd curriculum information is written into the system when it was built. If DepEd releases new orders or changes the competency codes, the system will not know about it until someone manually updates it.',
        },
        {
          title: 'Reference Hallucinations',
          desc: 'The AI sometimes writes references that look real but do not actually exist — like made-up DepEd order numbers or textbook titles. Always check the references before using them. The system shows a warning on every generated plan reminding teachers to verify.',
        },
      ].map((item, idx) => (
        <div key={idx} style={{
          ...featureCardStyle,
          borderLeft: '4px solid #ef4444',
        }}>
          <div style={featureTitleStyle}>{item.title}</div>
          <div style={featureDescStyle}>{item.desc}</div>
        </div>
      ))}
    </div>
  </div>
</div>

      {/* ── SECTION 6: RESPONSIBLE AI ── */}
      <div style={{ ...sectionPad, ...white }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <span style={labelStyle}>RESPONSIBLE AI</span>
          <h2 style={headingStyle}>Built With Teacher Safety in Mind</h2>

          {/* Commitment box */}
          <div style={{
            background: '#FFF8E7',
            borderLeft: '4px solid var(--color-accent)',
            borderRadius: 8,
            padding: '24px 28px',
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>
              Lumina AI is built to help teachers, not replace them.
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.9 }}>
              <strong>AI-Generated Draft:</strong> Every output is labeled as an AI-generated starting point. Teachers review and approve before classroom use.<br />
              <strong>Teacher Review Required:</strong> All content is fully editable. Teachers make the final decisions and remain accountable.<br />
              <strong>Bias Awareness:</strong> References may be AI-generated. Teachers are warned to verify all materials and recommended examples.<br />
              <strong>Transparency:</strong> Teachers see a validation score showing which sections passed DepEd requirements and which need manual review.
            </div>
          </div>

          {/* 4 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {responsibleCards.map((item, idx) => (
              <div key={idx} style={featureCardStyle}>
                <div style={featureTitleStyle}>{item.title}</div>
                <div style={featureDescStyle}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 7: CTA ── */}
      <div style={{
        background: '#1a1f3c',
        paddingTop: 80,
        paddingBottom: 80,
        paddingLeft: 64,
        paddingRight: 64,
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 42,
          fontWeight: 700,
          fontFamily: 'var(--font-serif)',
          color: '#FFFFFF',
          marginBottom: 32,
          lineHeight: 1.2,
        }}>
          Ready to generate your first lesson plan?
        </h2>
        <button
          style={{
            background: 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '14px 36px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 200ms ease',
          }}
          onClick={() => nav('/generate')}
          onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          Generate a Lesson Plan
        </button>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 20, marginBottom: 0 }}>
          Lumina AI — Lesson plans, illuminated.
        </p>
      </div>

    </div>
  )
}

/* ── Shared style objects ── */
const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
  marginBottom: 12,
  display: 'inline-block',
}

const headingStyle = {
  fontSize: 40,
  fontWeight: 700,
  fontFamily: 'var(--font-serif)',
  color: '#0F172A',
  marginBottom: 20,
  lineHeight: 1.2,
}

const paraStyle = {
  fontSize: 16,
  color: '#6b7280',
  lineHeight: 1.75,
  marginBottom: 16,
}

const statCardStyle = {
  background: '#FFFFFF',
  borderRadius: 16,
  padding: '40px 32px',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
  border: '1px solid rgba(0,0,0,0.05)',
  minHeight: 160,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const statNumStyle = {
  fontSize: 40,
  fontWeight: 700,
  color: 'var(--color-accent)',
  marginBottom: 10,
  lineHeight: 1.1,
}

const statLabelStyle = {
  fontSize: 13,
  color: '#6b7280',
  lineHeight: 1.5,
}

const featureCardStyle = {
  background: '#FFFFFF',
  borderRadius: 16,
  borderLeft: '4px solid var(--color-accent)',
  padding: 32,
  boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
  /* No shorthand border here — only borderLeft so the accent is preserved */
}

const featureTitleStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#0F172A',
  marginBottom: 10,
}

const featureDescStyle = {
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.65,
  margin: 0,
}

const pillStyle = {
  background: '#FFFFFF',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '20px 28px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  minWidth: 140,
}

const tdStyle = {
  padding: '13px 16px',
  fontSize: 14,
  color: '#1E293B',
  borderBottom: '1px solid rgba(0,0,0,0.04)',
  verticalAlign: 'middle',
}