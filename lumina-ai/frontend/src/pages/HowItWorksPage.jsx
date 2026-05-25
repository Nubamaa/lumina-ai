import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function HowItWorksPage() {
  const nav = useNavigate()

  const steps = [
    {
      number: '01',
      title: 'Fill In Details',
      description: 'Enter the subject, grade level, topic, duration, difficulty, curriculum, lesson plan type, and any special instructions.',
    },
    {
      number: '02',
      title: 'AI Generates',
      description: "Lumina checks the grade level, Bloom's Taxonomy level, RRMLAG steps, and your topic to build a complete DepEd lesson plan.",
    },
    {
      number: '03',
      title: 'Review and Save',
      description: 'Check the generated plan, make any changes you need, then download as PDF or save to Word. Ready to use right away.',
    },
  ]

  const pipeline = [
    { title: 'Teacher Input',  sub: 'Subject, Grade, Topic, Curriculum, Notes' },
    { title: 'Prompt Builder', sub: "Decision logic, Bloom's levels, RRMLAG rules" },
    { title: 'Groq LLM',       sub: 'LLaMA 3.3 70B generates HTML lesson plan' },
    { title: 'Validator',      sub: 'Checks all 9 required sections' },
  ]

  return (
    <div style={{ color: '#0F172A', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── SECTION 1: HERO ── */}
      <div style={{
        background: '#F5F0E8',
        paddingTop: 120,
        paddingBottom: 80,
        paddingLeft: 64,
        paddingRight: 64,
        textAlign: 'center',
      }}>
        <span style={labelStyle}>ANLYTC4 FINAL PROJECT — HOW IT WORKS</span>
        <h1 style={{
          fontSize: 52,
          fontWeight: 700,
          fontFamily: 'var(--font-serif)',
          color: '#0F172A',
          lineHeight: 1.15,
          marginBottom: 20,
          marginTop: 0,
        }}>
          From Your Details to a Complete Lesson Plan in Seconds
        </h1>
        <p style={{
          fontSize: 18,
          color: '#6b7280',
          lineHeight: 1.7,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          Fill in your lesson details and Lumina AI will generate a complete DepEd lesson plan for you to review and use.
        </p>
      </div>

      {/* ── SECTION 2: 3 STEPS ── */}
      <div style={{ background: '#FFFFFF', padding: '80px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={labelStyle}>THE PROCESS</span>
          <h2 style={{ ...headingStyle, marginBottom: 48 }}>Three Steps to a Ready-to-Use Lesson Plan</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '40px 36px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Large background number */}
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  fontSize: 96,
                  fontWeight: 800,
                  color: 'rgba(245,176,0,0.08)',
                  lineHeight: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  {step.number}
                </div>
                <div style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  marginBottom: 20,
                  lineHeight: 1,
                }}>
                  {step.number}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.65 }}>
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: AGENT ARCHITECTURE ── */}
      <div style={{ background: '#F5F0E8', padding: '80px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={labelStyle}>AGENT ARCHITECTURE</span>
          <h2 style={{ ...headingStyle, marginBottom: 12 }}>How the Agent Thinks</h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 56, lineHeight: 1.6 }}>
            Every lesson plan goes through these 5 steps automatically.
          </p>

          {/* Pipeline diagram */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>

            {/* Row 1 — 4 pipeline boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, alignItems: 'center' }}>
              {pipeline.map((box, idx) => (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      flex: 1,
                      background: '#FFFFFF',
                      border: '2px solid var(--color-accent)',
                      borderRadius: 14,
                      padding: '22px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                        {box.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                        {box.sub}
                      </div>
                    </div>
                    {idx < 3 && (
                      <div style={{
                        color: 'var(--color-accent)',
                        fontSize: 24,
                        fontWeight: 700,
                        padding: '0 12px',
                        flexShrink: 0,
                      }}>→</div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Down arrow — aligned to last column */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 4, marginBottom: 4 }}>
              <div /><div /><div />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ color: 'var(--color-accent)', fontSize: 24, fontWeight: 700 }}>↓</div>
              </div>
            </div>

            {/* Row 2 — Output box under Validator */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              <div /><div /><div />
              <div style={{
                background: '#1a1f3c',
                borderRadius: 14,
                padding: '22px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(26,31,60,0.18)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  Output
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  Complete DLP ready to print or download
                </div>
              </div>
            </div>

          </div>

          {/* Info box */}
          <div style={{
            background: '#FFF8E7',
            borderLeft: '4px solid var(--color-accent)',
            borderRadius: 10,
            padding: '18px 24px',
            marginTop: 48,
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: '#0F172A' }}>Three-tier fallback chain:</strong> If the main AI model fails, Lumina automatically tries a backup model, then a shorter prompt, then a ready-made template. Teachers always get a lesson plan — never a blank error.
          </div>
        </div>
      </div>

      {/* ── SECTION 4: WHY IT MATTERS ── */}
      <div style={{ background: '#FFFFFF', padding: '80px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={labelStyle}>WHY IT MATTERS</span>
          <h2 style={{ ...headingStyle, marginBottom: 48 }}>Built to Match DepEd Standards</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { stat: '9',        label: 'Required sections included every time' },
              { stat: 'RRMLAG',   label: 'Lesson steps always follow the correct RRMLAG order' },
              { stat: '100%',     label: 'A lesson plan is always produced, never an error page' },
              { stat: '<30s',     label: 'Average time to generate a full lesson plan' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: '#F5F0E8',
                borderRadius: 16,
                padding: '36px 24px',
                textAlign: 'center',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  marginBottom: 10,
                  lineHeight: 1,
                }}>
                  {item.stat}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 5: CTA ── */}
      <div style={{
        background: '#1a1f3c',
        paddingTop: 80,
        paddingBottom: 80,
        paddingLeft: 64,
        paddingRight: 64,
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 44,
          fontWeight: 700,
          fontFamily: 'var(--font-serif)',
          color: '#FFFFFF',
          marginBottom: 32,
          lineHeight: 1.2,
          marginTop: 0,
        }}>
          Try it now — generate your first lesson plan.
        </h2>
        <button
          style={{
            background: 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '15px 40px',
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
        <p style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
          marginTop: 20,
          marginBottom: 0,
        }}>
          Lumina AI — Lesson plans, illuminated.
        </p>
      </div>

    </div>
  )
}

/* ── Shared styles ── */
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
  marginBottom: 24,
  lineHeight: 1.2,
  marginTop: 0,
}