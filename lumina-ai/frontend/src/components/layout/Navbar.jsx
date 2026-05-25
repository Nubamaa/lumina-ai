import React from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo.svg'

export default function Navbar() {
  return (
    <header className="site-header" style={{height:64, background:'var(--color-surface)', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', position:'fixed', top:0, left:0, right:0, zIndex:50}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:'100%', paddingLeft:64, paddingRight:64}}>
        <div style={{display:'flex', alignItems:'center', gap:12, minWidth:0}}>
          <img src={logo} alt="Lumina" style={{width:32, height:32, display:'block', flex:'0 0 auto'}} />
          <div style={{minWidth:0, lineHeight:1.1}}>
            <div style={{color:'var(--color-primary)', fontFamily:'var(--font-serif)', fontSize:14, fontWeight:600, whiteSpace:'nowrap'}}>Lumina AI</div>
            <div style={{color:'var(--color-text-muted)', fontSize:10, whiteSpace:'nowrap'}}>Lesson plans, illuminated.</div>
          </div>
        </div>

        <nav style={{display:'flex', alignItems:'center', gap:24, whiteSpace:'nowrap'}}>
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Home</NavLink>
          <NavLink to="/how-it-works" className={({isActive}) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>How It Works</NavLink>
          <NavLink to="/history" className={({isActive}) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Lessons</NavLink>
          <NavLink to="/about" className={({isActive}) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>About</NavLink>
        </nav>
      </div>
    </header>
  )
}
