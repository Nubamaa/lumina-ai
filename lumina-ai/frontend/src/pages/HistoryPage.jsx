import React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory } from '../services/api'
import { getFromSession, ensureHistory } from '../services/storage'
import HistoryCard from '../components/history/HistoryCard'
import HistoryEmptyState from '../components/history/HistoryEmptyState'

export default function HistoryPage(){
  const nav = useNavigate()
  const [items, setItems] = useState([])
  useEffect(()=>{
    ensureHistory()
    // Use only sessionStorage - no API calls
    const s = getFromSession()
    setItems(s)
  }, [])

  return (
    <div className="min-h-screen">
      <main className="min-h-screen">
        <div className="page-container py-8">
          <header className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold" style={{fontFamily:'var(--font-serif)'}}>Saved Lesson Plans</h2>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full" title="Notifications">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button onClick={()=>nav('/generate')} className="px-4 py-2" style={{background:'var(--color-accent)', color:'#fff', borderRadius:8}}>Create New Plan</button>
            </div>
          </header>

          <div className="bg-amber-50 text-amber-900 p-4 rounded-xl flex gap-3 items-center border border-amber-100 mb-6">
            <span className="material-symbols-outlined">info</span>
            <p className="text-sm">Plans now include curriculum, output format, competency codes, and extraction warnings for faster review.</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <input className="w-full border border-slate-100 rounded-lg px-4 py-2" placeholder="Search by topic, grade, or subject..." />
            </div>
            <div className="flex gap-2">
              <select className="border border-slate-100 rounded-lg px-4 py-2 text-sm bg-white pr-8 appearance-none cursor-pointer">
                <option>All Grades</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {items.length===0 ? (
              <HistoryEmptyState />
            ) : (
              items.map(i=> <HistoryCard key={i.id} plan={i} />)
            )}
          </div>

          <footer className="flex items-center justify-between py-6 border-t border-slate-100 mt-8">
            <p className="text-slate-500 text-sm">Showing {items.length} saved plans</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-slate-100 rounded-lg text-sm disabled:opacity-50" disabled>Previous</button>
              <button className="px-4 py-2 border border-slate-100 rounded-lg text-sm">Next</button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
