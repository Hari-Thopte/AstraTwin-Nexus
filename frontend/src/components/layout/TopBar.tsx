import { Clock3, LockKeyhole, MapPin, Menu, Radio, Satellite, Wifi, WifiOff } from 'lucide-react'
import { useNexusStore } from '../../store/nexusStore'
import type { InformationMode } from '../../types/nexus'
import { useMissionExperience } from '../experience/MissionExperienceContext'

function missionTime(seconds: number) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const secs = seconds % 60
  return `${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function countdown(seconds: number) {
  const value = Math.max(0, seconds)
  return `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor((value % 3600) / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

const MODES: Array<{ id: InformationMode; label: string; purpose: string }> = [
  { id: 'engineer', label: 'Mission Engineer', purpose: 'Show technical evidence, data sources, and calculation details.' },
  { id: 'commander', label: 'Mission Commander', purpose: 'Prioritize mission risk, recommendations, and decision controls.' },
  { id: 'public', label: 'Public Explorer', purpose: 'Use plain-language, read-only mission explanations.' },
]

export function TopBar() {
  const mission = useNexusStore(state => state.mission)
  const communication = useNexusStore(state => state.communication)
  const mode = useNexusStore(state => state.mode)
  const setMode = useNexusStore(state => state.setMode)
  const backend = useNexusStore(state => state.backendConnected)
  const lastAction = useNexusStore(state => state.lastAction)
  const { destination, setMobileMenuOpen } = useMissionExperience()

  return (
    <header className="nexus-topbar fixed z-20 flex items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
        <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open mission navigation"><Menu size={17} /></button>
        <Satellite size={14} className="shrink-0 text-cyan-400" />
        <div className="min-w-0"><div className="truncate text-xs font-medium text-slate-200">{mission.name}</div><div className="truncate text-[9px] uppercase tracking-[0.13em] text-slate-600">{lastAction}</div></div>
        <div className="topbar-phase ml-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-cyan-300">{mission.phase}</div>
      </div>

      <div className="topbar-cell topbar-destination"><div className="topbar-label">Destination</div><div className="flex items-center gap-1 font-mono text-[10px] text-cyan-200"><MapPin size={10} />{destination.name}</div></div>
      <div className="topbar-cell topbar-clock"><div className="topbar-label">Mission time</div><div className="flex items-center gap-1 font-mono text-[11px] text-slate-200"><Clock3 size={10} className="text-slate-500" />{missionTime(mission.elapsedSeconds)}</div></div>
      <div className="topbar-cell topbar-comm"><div className="topbar-label">Earth link</div><div className={`flex items-center gap-1.5 text-[11px] ${communication.earthConnected ? 'text-emerald-300' : 'text-red-300'}`}>{communication.earthConnected ? <Wifi size={12} /> : <WifiOff size={12} />}{communication.earthConnected ? `${communication.delaySeconds}s delay` : countdown(communication.blackoutRemainingSeconds)}</div></div>
      <div className="topbar-cell topbar-sync"><div className="topbar-label">Mission services</div><div className={`flex items-center gap-1.5 text-[10px] ${backend ? 'text-emerald-300' : 'text-cyan-300'}`}><Radio size={11} />{backend ? 'FastAPI live' : 'Local fallback'}</div></div>
      <div className="mode-switch mr-3" role="group" aria-label="Information view">
        {MODES.map(item => <button key={item.id} type="button" onClick={() => setMode(item.id)} className={mode === item.id ? 'active' : ''} aria-pressed={mode === item.id} aria-label={`${item.label}: ${item.purpose}`} title={item.purpose}>{item.label}</button>)}
      </div>
      <div className="static-snapshot-badge mr-3" title="Mission values are held as a static demonstration snapshot"><LockKeyhole size={10} /><span>STATIC</span></div>
    </header>
  )
}
