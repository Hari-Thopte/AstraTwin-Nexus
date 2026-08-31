import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronRight, Expand, Gauge, Gavel, Minimize, RefreshCcw, Sparkles, Wrench } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NexusRuntime } from '../nexus/NexusRuntime'
import { LaunchExperience } from '../experience/LaunchExperience'
import { MissionExperienceProvider, useMissionExperience } from '../experience/MissionExperienceContext'
import { useNexusStore } from '../../store/nexusStore'
import { MISSION_CONFIG, reportMissionConsistency } from '../../config/mission'

const SpaceJourney = lazy(() => import('../experience/SpaceJourney').then(module => ({ default: module.SpaceJourney })))

const MODE_CONTEXT = {
  engineer: { label: 'Engineering view', description: 'Technical evidence, sources, and calculation methods are visible.', action: 'Open telemetry', to: '/telemetry', icon: Wrench },
  commander: { label: 'Command view', description: 'Risk, recommendations, and human decisions are prioritized.', action: 'Open decisions', to: '/mission-council', icon: Gavel },
  public: { label: 'Public view', description: 'Mission information is simplified and operational decisions are read-only.', action: 'Mission overview', to: '/mission-control', icon: BookOpen },
} as const
const MOBILE_MODE_OPTIONS = [
  { id: 'engineer', label: 'Engineer' },
  { id: 'commander', label: 'Command' },
  { id: 'public', label: 'Public' },
] as const

function InformationModeBar() {
  const mode = useNexusStore(state => state.mode)
  const setMode = useNexusStore(state => state.setMode)
  const context = MODE_CONTEXT[mode]
  const Icon = context.icon

  return (
    <div className={`information-mode-bar ${mode}`} role="status" aria-live="polite">
      <Icon size={14} />
      <strong>{context.label}</strong>
      <span>{context.description}</span>
      <Link to={context.to}>{context.action}<ChevronRight size={13} /></Link>
      <div className="mobile-information-modes" role="group" aria-label="Information view">
        {MOBILE_MODE_OPTIONS.map(option => <button key={option.id} type="button" onClick={() => setMode(option.id)} className={mode === option.id ? 'active' : ''} aria-pressed={mode === option.id}>{option.label}</button>)}
      </div>
    </div>
  )
}

function MissionUtilityControls() {
  const { introVisible, showIntro, reducedMotion, toggleReducedMotion, lowDetail, toggleLowDetail } = useMissionExperience()
  const location = useLocation()
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }

  if (introVisible || location.pathname === '/mission-council') return null
  return (
    <div className="mission-utility-controls" aria-label="Mission display controls">
      <button onClick={showIntro} title="Replay launch"><RefreshCcw size={13} /><span>Replay launch</span></button>
      <button className={reducedMotion ? 'active' : ''} onClick={toggleReducedMotion} title="Toggle reduced motion"><Sparkles size={13} /><span>{reducedMotion ? 'Motion reduced' : 'Reduce motion'}</span></button>
      <button className={lowDetail ? 'active' : ''} onClick={toggleLowDetail} title="Toggle low-detail mode"><Gauge size={13} /><span>{lowDetail ? 'Low detail' : 'Full detail'}</span></button>
      <button onClick={toggleFullscreen} title="Toggle full-screen mission mode">{fullscreen ? <Minimize size={13} /> : <Expand size={13} />}<span>{fullscreen ? 'Exit full screen' : 'Full screen'}</span></button>
    </div>
  )
}

function MissionShell() {
  const location = useLocation()
  const { introVisible, reducedMotion } = useMissionExperience()
  const emergencyActive = useNexusStore(state => Boolean(state.simulation.activeScenario))
  const mode = useNexusStore(state => state.mode)
  const mission = useNexusStore(state => state.mission)
  const assets = useNexusStore(state => state.assets)

  useEffect(() => {
    reportMissionConsistency({
      missionName: mission.name,
      destination: MISSION_CONFIG.destination,
      assetNames: assets.map(asset => asset.name),
    })
  }, [assets, mission.name])

  return (
    <div className={`mission-app-shell information-mode-${mode} ${introVisible ? 'intro-active' : 'operations-active'} ${reducedMotion ? 'reduced-motion' : ''} ${emergencyActive ? 'emergency-mode' : ''} ${location.pathname === '/mission-council' ? 'mission-council-active' : ''}`}>
      <NexusRuntime />
      <Suspense fallback={<div className="space-journey space-fallback" aria-hidden="true" />}><SpaceJourney /></Suspense>
      <div className="space-overlay-shade" aria-hidden="true" />
      <LaunchExperience />
      <div className="command-interface" aria-hidden={introVisible}>
        <Sidebar />
        <TopBar />
        <main className="mission-content">
          <InformationModeBar />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="route-transition"
              initial={reducedMotion ? false : { opacity: 0, y: 10, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -7, filter: 'blur(5px)' }}
              transition={{ duration: reducedMotion ? 0 : 0.26, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <MissionUtilityControls />
        <div className="simulation-footer" aria-label="Application data mode">Simulation</div>
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <MissionExperienceProvider><MissionShell /></MissionExperienceProvider>
  )
}
