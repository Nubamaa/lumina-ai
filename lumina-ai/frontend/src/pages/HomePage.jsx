import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const nav = useNavigate()

  const features = [
    { icon: '📚', title: 'Grade Adaptability',  desc: 'Works for all grade levels from Kindergarten to Grade 12. Vocabulary and activities adjust to match the grade.' },
    { icon: '🧠', title: 'Bloom\'s Taxonomy',    desc: 'Lesson objectives use the right Bloom\'s Taxonomy level based on the grade and difficulty you choose.' },
    { icon: '📖', title: 'All Subjects',         desc: 'Works for Science, Math, English, Filipino, Social Studies, TLE, PE, and all Senior High tracks.' },
    { icon: '🌏', title: 'Local Context',        desc: 'Use the Special Notes field to ask for local Filipino examples or content specific to your community.' },
    { icon: '✅', title: 'DepEd Standards',      desc: 'Follows DepEd Order 42, s. 2016 with all 9 required sections, correct headings, and RRMLAG steps in the right order.' },
    { icon: '⚡', title: 'AI-Powered',           desc: 'Uses Groq and LLaMA 3.3 70B to generate a full lesson plan in under 30 seconds.' },
  ]

  return (
    <div style={{ color: '#0F172A', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── HERO ── */}
      <div style={{
        background: '#F5F0E8',
        paddingTop: 20,
        paddingBottom: 60,
        paddingLeft: 80,
        paddingRight: 80,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'center',
        }}>

          {/* Left — copy */}
          <div>
            <span style={{
              background: '#FFF6E6',
              color: 'var(--color-accent)',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: 28,
            }}>
              DEPED COMPLIANT | DO 42, S. 2016
            </span>

            <h1 style={{
              fontSize: 58,
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              color: '#0F172A',
              lineHeight: 1.1,
              marginBottom: 24,
              marginTop: 0,
            }}>
              Complete DepEd lesson plans in seconds.
            </h1>

            <p style={{
              fontSize: 18,
              color: '#6b7280',
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 480,
            }}>
              Lumina AI helps Filipino teachers write complete DepEd lesson plans fast. Spend more time teaching, less time on paperwork.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => nav('/generate')}
                style={{
                  background: 'var(--color-accent)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px 28px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 200ms ease',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                Generate a Lesson Plan
              </button>
              <button
                onClick={() => nav('/how-it-works')}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 10,
                  padding: '14px 28px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 200ms ease',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={e => e.currentTarget.style.background = '#FFFFFF'}
              >
                How It Works
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
              {['9 Required Sections', 'RRMLAG Sequencing', 'Bloom\'s Taxonomy Aligned', 'Free to Use'].map((badge, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — DLP preview card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              padding: 32,
              width: '100%',
              maxWidth: 400,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Daily Lesson Plan</span>
                <span style={{
                  background: '#dcfce7',
                  color: '#16a34a',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 999,
                }}>Generated</span>
              </div>

              {/* Header rows */}
              {[
                { label: 'School',   value: 'Sunrise High School' },
                { label: 'Teacher',  value: '' },
                { label: 'Grade',    value: 'Grade 9' },
                { label: 'Subject',  value: 'Biology' },
                { label: 'Quarter',  value: '2nd Quarter' },
                { label: 'Duration', value: '50 Minutes' },
              ].map((row, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{row.label}</span>
                  <span style={{
                    fontSize: 13,
                    color: row.value ? '#0F172A' : '#cbd5e1',
                    fontWeight: row.value ? 600 : 400,
                    fontStyle: row.value ? 'normal' : 'italic',
                  }}>
                    {row.value || 'To be filled'}
                  </span>
                </div>
              ))}

              {/* Section pills */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Sections Generated
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['I. Objectives', 'II. Content', 'III. Resources', 'IV. Procedure', 'V. Evaluation', 'VI. Assignment', 'VII. Remarks', 'VIII. Reflection'].map((sec, idx) => (
                    <span key={idx} style={{
                      background: '#F5F0E8',
                      color: '#0F172A',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                    }}>
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Validation score */}
              <div style={{
                marginTop: 20,
                background: '#F5F0E8',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>DLP Quality Check</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>9 / 9 ✓</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background: '#1a1f3c', padding: '40px 80px' }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}>
          {[
            { number: '< 30s',  label: 'Generation time' },
            { number: '9',      label: 'Required sections' },
            { number: '100%',   label: 'Output delivery rate' },
            { number: 'Free',   label: 'For all teachers' },
          ].map((stat, idx) => (
            <div key={idx} style={{
              textAlign: 'center',
              padding: '16px 24px',
              borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 6, lineHeight: 1 }}>
                {stat.number}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS TEASER ── */}
      <div style={{ background: '#FFFFFF', padding: '80px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <span style={labelStyle}>HOW IT WORKS</span>
          <h2 style={{ ...headingStyle, marginBottom: 48 }}>How Lumina AI Works</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { num: '01', title: 'Fill In Details',  desc: 'Enter the subject, grade level, topic, duration, difficulty, curriculum, lesson plan type, and any special instructions.' },
              { num: '02', title: 'AI Generates',     desc: 'Lumina builds the objectives, RRMLAG procedure steps, evaluation items, and assignment based on your inputs.' },
              { num: '03', title: 'Review and Save',  desc: 'Check the plan, edit anything you want, then download as PDF or save to Word.' },
            ].map((step, idx) => (
              <div key={idx} style={{
                background: '#F5F0E8',
                borderRadius: 16,
                padding: '36px 32px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -8,
                  right: 16,
                  fontSize: 80,
                  fontWeight: 800,
                  color: 'rgba(245,158,11,0.08)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 16, lineHeight: 1 }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={() => nav('/how-it-works')}
              style={{
                background: 'transparent',
                color: 'var(--color-accent)',
                border: '2px solid var(--color-accent)',
                borderRadius: 10,
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)' }}
            >
              See Full Architecture →
            </button>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ background: '#1a1f3c', padding: '80px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <span style={{ ...labelStyle, color: 'rgba(245,158,11,0.9)' }}>BUILT FOR FILIPINO TEACHERS</span>
          <h2 style={{
            fontSize: 40,
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: '#FFFFFF',
            marginBottom: 48,
            lineHeight: 1.2,
            marginTop: 0,
          }}>
            Made for Filipino Teachers
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map((f, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '28px 28px',
                transition: 'background 200ms ease',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{
        background: '#F5F0E8',
        padding: '100px 80px',
        textAlign: 'center',
      }}>
        <span style={labelStyle}>GET STARTED</span>
        <h2 style={{
          fontSize: 48,
          fontWeight: 800,
          fontFamily: 'var(--font-serif)',
          color: '#0F172A',
          marginBottom: 20,
          lineHeight: 1.15,
          marginTop: 0,
        }}>
          Ready to reclaim your time?
        </h2>
        <p style={{
          fontSize: 17,
          color: '#6b7280',
          marginBottom: 40,
          maxWidth: 500,
          margin: '0 auto 40px auto',
          lineHeight: 1.7,
        }}>
            Generate a complete DepEd lesson plan in seconds. Free to use, no account needed.
        </p>
        <button
          onClick={() => nav('/generate')}
          style={{
            background: 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '16px 44px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 200ms ease',
            boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          Generate a Lesson Plan — Free
        </button>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
          No account required. Outputs are AI-generated drafts — always review before classroom use.
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