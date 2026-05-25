import React, { useState } from 'react'

export default function DLPToolbar({lessonPlan, exportText}){
  const [copied, setCopied] = useState(false)
  const [hover, setHover] = useState({copy:false,pdf:false,word:false})

  const handleCopy = async () => {
    try{
      const text = typeof exportText === 'string' ? exportText : (typeof lessonPlan === 'string' ? lessonPlan : (lessonPlan || ''))
      await navigator.clipboard.writeText(text || '')
      setCopied(true)
      setTimeout(()=>setCopied(false),2000)
    }catch(e){
      console.warn(e)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const exportToWord = (content) => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Lesson Plan</title></head>
        <body>${content}</body>
      </html>
    `
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lesson-plan.doc'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleWord = () => {
    const el = document.getElementById('dlp-document')
    if(!el) return
    exportToWord(el.innerHTML)
  }

  const baseBtn = {
    borderRadius:8,
    padding:'8px 16px',
    fontSize:13,
    fontWeight:600,
    display:'inline-flex',
    alignItems:'center',
    gap:6,
    cursor:'pointer',
    transition:'background 0.2s',
    border:'none',
    background:'transparent'
  }

  const copyStyle = {
    ...baseBtn,
    background: hover.copy ? '#e5e7eb' : '#f3f4f6',
    color: '#374151',
    border: 'none'
  }

  const pdfStyle = {
    ...baseBtn,
    background: hover.pdf ? '#fde68a' : '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d'
  }

  const wordStyle = {
    ...baseBtn,
    background: hover.word ? '#bfdbfe' : '#dbeafe',
    color: '#1e40af',
    border: '1px solid #93c5fd'
  }

  return (
    <div style={{display:'flex', gap:10, alignItems:'center', justifyContent:'flex-end', marginBottom:20}}>
      <button
        onClick={handleCopy}
        onMouseEnter={() => setHover(h => ({...h,copy:true}))}
        onMouseLeave={() => setHover(h => ({...h,copy:false}))}
        style={copyStyle}
        aria-label="Copy to clipboard"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="9" y="9" width="9" height="11" rx="2" stroke="#374151" strokeWidth="1.2" fill="none" />
          <rect x="4" y="4" width="11" height="11" rx="2" stroke="#374151" strokeWidth="1.2" fill="none" />
        </svg>
        Copy to Clipboard
      </button>

      <button
        onClick={handlePrint}
        onMouseEnter={() => setHover(h => ({...h,pdf:true}))}
        onMouseLeave={() => setHover(h => ({...h,pdf:false}))}
        style={pdfStyle}
        aria-label="Save as PDF"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 3v6h6" stroke="#92400e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="#92400e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Save as PDF
      </button>

      <button
        onClick={handleWord}
        onMouseEnter={() => setHover(h => ({...h,word:true}))}
        onMouseLeave={() => setHover(h => ({...h,word:false}))}
        style={wordStyle}
        aria-label="Save as Word"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="3" y="3" width="14" height="18" rx="2" stroke="#1e40af" strokeWidth="1.2" fill="none" />
          <path d="M7 7h6M7 11h6M7 15h4" stroke="#1e40af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Save as Word
      </button>

      {copied && (
        <div style={{position:'absolute', right:24, top:12, background:'#16A34A', color:'#fff', padding:'6px 10px', borderRadius:8}}>Copied to clipboard!</div>
      )}
    </div>
  )
}
