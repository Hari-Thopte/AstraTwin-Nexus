import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Atom, Box, BrainCircuit, ChevronRight, FileCheck2, FlaskConical, GitBranch, Home, MapPin, Satellite, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import { useNexusStore } from '../../store/nexusStore'
import { NEXUS_STATUS_COLORS } from '../../utils/nexusData'
import { useMissionExperience } from '../experience/MissionExperienceContext'
import { MISSION_CONFIG } from '../../config/mission'

const NAV_ITEMS = [
  { to: '/mission-control', label: 'Mission Control', icon: Home },
  { to: '/digital-twin', label: 'Digital Twin', icon: Box },
  { to: '/telemetry', label: 'Telemetry', icon: Activity },
  { to: '/incidents', label: 'Incident Intelligence', icon: Atom },
  { to: '/mission-council', label: 'Mission Council Review', icon: BrainCircuit },
  { to: '/future-simulator', label: 'Future Simulator', icon: FlaskConical },
  { to: '/science', label: 'Science Discovery', icon: Sparkles },
  { to: '/mission-memory', label: 'Mission Memory', icon: GitBranch },
]

export function Sidebar() {
  const assets = useNexusStore(state => state.assets)
  const incidents = useNexusStore(state => state.incidents)
  const plan = useNexusStore(state => state.plan)
  const location = useLocation()
  const { destination, mobileMenuOpen, setMobileMenuOpen } = useMissionExperience()

  return (
    <>
    <button className={`mobile-nav-backdrop ${mobileMenuOpen ? 'visible' : ''}`} aria-label="Close mission navigation" onClick={() => setMobileMenuOpen(false)} />
    <aside className={`nexus-sidebar fixed z-30 flex flex-col overflow-hidden ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Mission navigation">
      <div className="sidebar-brand border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="nexus-logo"><Satellite size={17} /></div>
          <div className="sidebar-copy min-w-0">
            <div className="text-sm font-bold tracking-[0.08em] text-white">ASTRATWIN <span className="text-cyan-300">NEXUS</span></div>
            <div className="mt-0.5 truncate text-[8px] uppercase tracking-[0.15em] text-slate-500">Lunar operations console</div>
          </div>
          <button className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={17} /></button>
        </div>
        <div className="sidebar-copy mt-3 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.04] px-2.5 py-2 text-[10px] leading-4 text-cyan-100/65">{MISSION_CONFIG.operatingRegion}<br /><span className="text-cyan-300">{MISSION_CONFIG.activePhase}</span></div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" aria-label="AstraTwin modules">
        <div className="sidebar-copy mb-2 px-2 text-[8px] uppercase tracking-[0.2em] text-slate-600">Mission modules</div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          const badge = to === '/incidents' && incidents.length ? String(incidents.length) : to === '/mission-council' && plan?.status === 'awaiting_approval' ? '!' : null
          return (
            <NavLink key={to} to={to} onClick={() => setMobileMenuOpen(false)} className={clsx('nexus-nav-item group', active && 'active')} title={label}>
              <Icon size={16} className="shrink-0" />
              <span className="sidebar-copy min-w-0 flex-1 truncate">{label}</span>
              {badge && <span className="sidebar-copy rounded-full bg-orange-400/15 px-1.5 py-0.5 text-[9px] font-bold text-orange-300">{badge}</span>}
              {active && <ChevronRight size={11} className="sidebar-copy text-cyan-400/55" />}
            </NavLink>
          )
        })}
        <div className="sidebar-divider" />
        <NavLink to="/reports-audit" onClick={() => setMobileMenuOpen(false)} className={clsx('nexus-nav-item group', location.pathname === '/reports-audit' && 'active')} title="Reports & Audit">
          <FileCheck2 size={16} className="shrink-0" /><span className="sidebar-copy min-w-0 flex-1 truncate">Reports & Audit</span>{location.pathname === '/reports-audit' && <ChevronRight size={11} className="sidebar-copy text-cyan-400/55" />}
        </NavLink>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="sidebar-destination sidebar-copy">
          <MapPin size={12} /><span><small>OPERATING THEATRE</small><strong>{destination.name}</strong></span><b>76%</b>
        </div>
        <div className="sidebar-copy mb-2 text-[9px] uppercase tracking-[0.15em] text-slate-600">Synchronized assets</div>
        <div className="grid grid-cols-3 gap-1.5">
          {assets.map(asset => <div key={asset.id} className="asset-mini" title={`${asset.name}: ${asset.status}`}><span style={{ background: NEXUS_STATUS_COLORS[asset.status] }} /> <b className="sidebar-copy">{asset.name.slice(0, 3).toUpperCase()}</b></div>)}
        </div>
      </div>
    </aside>
    </>
  )
}
