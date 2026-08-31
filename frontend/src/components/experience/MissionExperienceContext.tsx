import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { MISSION_CONFIG } from '../../config/mission'

export type DestinationId = 'lunar-south-pole' | 'mars' | 'earth-orbit' | 'ganymede'
export type JourneyPhase = 'prelaunch' | 'countdown' | 'ignition' | 'liftoff' | 'orbit' | 'travel' | 'arrival' | 'operations'

export interface DestinationProfile {
  id: DestinationId
  name: string
  shortName: string
  delay: string
  objective: string
  spacecraft: string
  conditions: string
  risks: string[]
  accent: string
  travelLabel: string
}

export const DESTINATIONS: Record<DestinationId, DestinationProfile> = {
  'lunar-south-pole': {
    id: 'lunar-south-pole',
    name: MISSION_CONFIG.operatingRegion,
    shortName: 'SHACKLETON',
    delay: `${MISSION_CONFIG.communicationDelaySeconds} seconds`,
    objective: MISSION_CONFIG.objective,
    spacecraft: MISSION_CONFIG.spacecraft,
    conditions: 'Low sun angle · permanent shadows · ice-rich regolith',
    risks: ['Lunar nightfall', 'Loose regolith', 'Earth-link occlusion'],
    accent: '#6ee7f9',
    travelLabel: 'EARTH → MOON → SHACKLETON',
  },
  mars: {
    id: 'mars',
    name: 'Mars — Jezero Crater',
    shortName: 'JEZERO',
    delay: '12 minutes',
    objective: 'Deploy surface science package and characterize Jezero delta sediment layers.',
    spacecraft: 'Nexus Ares Transfer Vehicle',
    conditions: 'Thin CO₂ atmosphere · dust storms · low gravity',
    risks: ['Dust storms', 'Radiation', 'Comm latency'],
    accent: '#f87060',
    travelLabel: 'EARTH → DEEP SPACE → MARS',
  },
  'earth-orbit': {
    id: 'earth-orbit',
    name: 'Earth Orbit — ISS Rendezvous',
    shortName: 'LEO 408 km',
    delay: '0.04 seconds',
    objective: 'Dock with orbital station and conduct micro-gravity telemetry calibration.',
    spacecraft: 'Nexus Orbital Shuttle',
    conditions: 'Micro-gravity · vacuum · rapid day-night cycling',
    risks: ['Debris avoidance', 'Thermal cycling', 'Docking precision'],
    accent: '#60a5fa',
    travelLabel: 'EARTH → LEO → ISS RENDEZVOUS',
  },
  ganymede: {
    id: 'ganymede',
    name: 'Ganymede — Jupiter System',
    shortName: 'GANYMEDE',
    delay: '46 minutes',
    objective: 'Survey subsurface ocean interface and magnetic field interactions.',
    spacecraft: 'Nexus Jovian Deep Probe',
    conditions: 'Intense radiation · sub-zero · magnetosphere interference',
    risks: ['Radiation belts', 'Comm blackout', 'Jupiter gravity'],
    accent: '#c084fc',
    travelLabel: 'EARTH → ASTEROID BELT → JUPITER SYSTEM',
  },
}

export const ACTIVE_DESTINATION = DESTINATIONS['lunar-south-pole']

interface MissionExperienceValue {
  destination: DestinationProfile
  setDestination: (id: DestinationId) => void
  phase: JourneyPhase
  setPhase: (phase: JourneyPhase) => void
  progress: number
  setProgress: (progress: number) => void
  introVisible: boolean
  showIntro: () => void
  completeIntro: () => void
  reducedMotion: boolean
  toggleReducedMotion: () => void
  lowDetail: boolean
  toggleLowDetail: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const MissionExperienceContext = createContext<MissionExperienceValue | null>(null)

export function MissionExperienceProvider({ children }: { children: ReactNode }) {
  const mediaReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [destinationId, setDestinationId] = useState<DestinationId>('lunar-south-pole')
  const [phase, setPhase] = useState<JourneyPhase>('prelaunch')
  const [progress, setProgress] = useState(0)
  const [introVisible, setIntroVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(mediaReduced)
  const [lowDetail, setLowDetail] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const setDestination = useCallback((id: DestinationId) => {
    setDestinationId(id)
    setPhase('prelaunch')
    setProgress(0)
    setIntroVisible(true)
  }, [])
  const showIntro = useCallback(() => {
    setPhase('prelaunch')
    setProgress(0)
    setIntroVisible(true)
  }, [])
  const completeIntro = useCallback(() => {
    setPhase('operations')
    setProgress(100)
    setIntroVisible(false)
  }, [])
  const toggleReducedMotion = useCallback(() => setReducedMotion(value => !value), [])
  const toggleLowDetail = useCallback(() => setLowDetail(value => !value), [])

  const value = useMemo<MissionExperienceValue>(() => ({
    destination: DESTINATIONS[destinationId],
    setDestination,
    phase,
    setPhase,
    progress,
    setProgress,
    introVisible,
    showIntro,
    completeIntro,
    reducedMotion,
    toggleReducedMotion,
    lowDetail,
    toggleLowDetail,
    mobileMenuOpen,
    setMobileMenuOpen,
  }), [destinationId, setDestination, phase, progress, introVisible, showIntro, completeIntro, reducedMotion, toggleReducedMotion, lowDetail, toggleLowDetail, mobileMenuOpen])

  return <MissionExperienceContext.Provider value={value}>{children}</MissionExperienceContext.Provider>
}

export function useMissionExperience() {
  const value = useContext(MissionExperienceContext)
  if (!value) throw new Error('useMissionExperience must be used within MissionExperienceProvider')
  return value
}
