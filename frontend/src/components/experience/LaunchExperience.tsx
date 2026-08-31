import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Clock3, MapPin, Orbit, Radio, Rocket, ShieldCheck, SkipForward, Sparkles, Timer, Zap } from 'lucide-react'
import { useEffect, type CSSProperties } from 'react'
import { MISSION_CONFIG } from '../../config/mission'
import { DESTINATIONS, type DestinationId, type JourneyPhase, useMissionExperience } from './MissionExperienceContext'

const PHASE_COPY: Record<JourneyPhase, { stage: string; title: string }> = {
  prelaunch: { stage: MISSION_CONFIG.launchPhases[0], title: 'Awaiting mission authorization' },
  countdown: { stage: MISSION_CONFIG.launchPhases[0], title: 'Ignition sequence active' },
  ignition: { stage: MISSION_CONFIG.launchPhases[0], title: 'Main engines online' },
  liftoff: { stage: MISSION_CONFIG.launchPhases[1], title: 'Leaving Earth' },
  orbit: { stage: MISSION_CONFIG.launchPhases[2], title: 'Earth orbit cleared' },
  travel: { stage: MISSION_CONFIG.launchPhases[3], title: 'Approaching destination' },
  arrival: { stage: MISSION_CONFIG.launchPhases[4], title: 'Orbit established' },
  operations: { stage: MISSION_CONFIG.launchPhases[5], title: 'Systems online' },
}

const PHASE_TIMING: Partial<Record<JourneyPhase, { duration: number; next: JourneyPhase; from: number; to: number }>> = {
  ignition: { duration: 1100, next: 'liftoff', from: 5, to: 16 },
  liftoff: { duration: 1400, next: 'orbit', from: 16, to: 35 },
  orbit: { duration: 1500, next: 'travel', from: 35, to: 52 },
  travel: { duration: 2200, next: 'arrival', from: 52, to: 90 },
  arrival: { duration: 1300, next: 'operations', from: 90, to: 100 },
}

const FLIGHT_STEPS: Array<{ phase: JourneyPhase; label: string }> = [
  { phase: 'ignition', label: MISSION_CONFIG.launchPhases[0] },
  { phase: 'liftoff', label: MISSION_CONFIG.launchPhases[1] },
  { phase: 'orbit', label: MISSION_CONFIG.launchPhases[2] },
  { phase: 'travel', label: MISSION_CONFIG.launchPhases[3] },
  { phase: 'arrival', label: MISSION_CONFIG.launchPhases[4] },
]

const DEST_ORDER: DestinationId[] = ['lunar-south-pole', 'earth-orbit', 'mars', 'ganymede']

export function LaunchExperience() {
  const { destination, setDestination, phase, setPhase, progress, setProgress, introVisible, completeIntro, reducedMotion, toggleReducedMotion } = useMissionExperience()

  useEffect(() => {
    if (phase !== 'countdown') return
    if (reducedMotion) {
      setPhase('arrival')
      setProgress(92)
      return
    }
    let count = 5
    setProgress(1)
    const interval = window.setInterval(() => {
      count -= 1
      if (count <= 0) {
        window.clearInterval(interval)
        setPhase('ignition')
        setProgress(5)
      }
    }, 620)
    return () => window.clearInterval(interval)
  }, [phase, reducedMotion, setPhase, setProgress])

  useEffect(() => {
    const timing = PHASE_TIMING[phase]
    if (!timing) return
    if (reducedMotion) {
      const timeout = window.setTimeout(() => timing.next === 'operations' ? completeIntro() : setPhase(timing.next), 260)
      return () => window.clearTimeout(timeout)
    }
    const started = performance.now()
    let frame = 0
    const advance = (now: number) => {
      const ratio = Math.min(1, (now - started) / timing.duration)
      setProgress(Math.round(timing.from + (timing.to - timing.from) * ratio))
      if (ratio < 1) frame = window.requestAnimationFrame(advance)
    }
    frame = window.requestAnimationFrame(advance)
    const timeout = window.setTimeout(() => timing.next === 'operations' ? completeIntro() : setPhase(timing.next), timing.duration)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [phase, reducedMotion, setPhase, setProgress, completeIntro])

  const launch = () => {
    setProgress(1)
    setPhase('countdown')
  }

  const activeIndex = ['countdown', 'ignition', 'liftoff', 'orbit', 'travel', 'arrival'].indexOf(phase)
  const isFlying = phase !== 'prelaunch'

  return (
    <AnimatePresence>
      {introVisible && (
        <motion.section
          className={`launch-experience phase-${phase}`}
          style={{ '--dest-accent': destination.accent } as CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: reducedMotion ? 0.1 : 0.55 }}
          aria-label={`${MISSION_CONFIG.name} launch visualization`}
        >
          <div className="launch-grid" />

          {/* Header */}
          <header className="launch-header">
            <div className="launch-brand">
              <span className="launch-brand-mark"><Orbit size={19} /></span>
              <span><strong>ASTRATWIN</strong> <b>NEXUS</b><small>{MISSION_CONFIG.name.toUpperCase()}</small></span>
            </div>
            <div className="launch-header-actions">
              <span className="systems-ready"><i /> SIMULATION READY</span>
              <button className={`skip-link ${reducedMotion ? 'active' : ''}`} onClick={toggleReducedMotion} aria-pressed={reducedMotion}>
                <Sparkles size={14} /> {reducedMotion ? 'Standard motion' : 'Reduce motion'}
              </button>
              <button className="skip-link" onClick={completeIntro}><SkipForward size={14} /> Skip animation</button>
            </div>
          </header>

          {/* Body */}
          <div className="launch-content">
            <AnimatePresence mode="wait">
              {!isFlying ? (
                <motion.div
                  key="prelaunch"
                  className="prelaunch-layout"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                >
                  {/* Left hero */}
                  <div className="launch-hero-copy">
                    <div className="launch-kicker"><span>01</span> MISSION LAUNCH</div>
                    <h1>ASTRATWIN<br /><em>NEXUS</em></h1>
                    <p>{MISSION_CONFIG.name}</p>
                    <div className="hero-rule">
                      <i />
                      <span>{destination.travelLabel}</span>
                    </div>
                  </div>

                  {/* Right console */}
                  <div className="destination-console">
                    <div className="console-heading">
                      <div><span className="console-index">SELECT MISSION</span><h2>Launch Destination</h2></div>
                      <MapPin size={18} />
                    </div>

                    {/* 4 destination selector tabs */}
                    <div className="destination-options" role="radiogroup" aria-label="Select launch destination">
                      {DEST_ORDER.map(id => {
                        const dest = DESTINATIONS[id]
                        const active = destination.id === id
                        return (
                          <button
                            key={id}
                            role="radio"
                            aria-checked={active}
                            className={`destination-option ${active ? 'selected' : ''}`}
                            style={{ '--orb-color': dest.accent } as CSSProperties}
                            onClick={() => setDestination(id)}
                          >
                            <span className="destination-orb" style={{ '--orb-color': dest.accent } as CSSProperties} />
                            <span>
                              <strong>{dest.name}</strong>
                              <small>{dest.shortName}</small>
                            </span>
                            {active && <Check size={13} />}
                          </button>
                        )
                      })}
                    </div>

                    {/* Active destination details */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={destination.id}
                        className="mission-brief"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div><Radio size={14} /><span>COMM DELAY<strong>{destination.delay}</strong></span></div>
                        <div><Clock3 size={14} /><span>SPACECRAFT<strong>{destination.spacecraft}</strong></span></div>
                        <div className="wide"><Sparkles size={14} /><span>OBJECTIVE<strong>{destination.objective}</strong></span></div>
                        <div className="wide"><ShieldCheck size={14} /><span>CONDITIONS<strong>{destination.conditions}</strong></span></div>
                        <div className="wide risk-row">
                          {destination.risks.map(r => <span key={r} className="risk-chip">{r}</span>)}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <button
                      className="launch-button"
                      onClick={launch}
                      style={{ '--btn-accent': destination.accent } as CSSProperties}
                    >
                      <span><Rocket size={17} /> Launch to {destination.shortName}</span>
                      <ArrowRight size={18} />
                    </button>
                    <div className="authorization"><ShieldCheck size={12} /> VISUALIZATION ONLY · NO SPACECRAFT COMMANDS</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="flight" className="flight-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flight-status">
                    <div className="launch-kicker"><span>02</span> {PHASE_COPY[phase].stage}</div>
                    <AnimatePresence mode="wait">
                      <motion.h1 key={phase} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                        {PHASE_COPY[phase].title}
                      </motion.h1>
                    </AnimatePresence>
                    <div className="flight-readout">
                      <div><span>CURRENT PHASE</span><strong>{PHASE_COPY[phase].stage}</strong></div>
                      <div><span>DESTINATION</span><strong style={{ color: destination.accent }}>{destination.shortName}</strong></div>
                      <div><span>VALUE TYPE</span><strong>Visualization progress</strong></div>
                    </div>
                    <div className="flight-progress">
                      <div><span>VISUALIZATION PROGRESS</span><strong>{progress}%</strong></div>
                      <div className="progress-track"><i style={{ width: `${progress}%`, background: destination.accent }} /></div>
                    </div>
                  </div>
                  <aside className="flight-telemetry">
                    <div className="telemetry-heading"><Zap size={15} /><span>LAUNCH SEQUENCE</span></div>
                    {FLIGHT_STEPS.map((item, index) => {
                      const itemIndex = ['ignition', 'liftoff', 'orbit', 'travel', 'arrival'].indexOf(item.phase)
                      return (
                        <div key={item.phase} className={`flight-step ${item.phase === phase ? 'active' : ''} ${itemIndex < activeIndex - 1 ? 'complete' : ''}`}>
                          <i>{itemIndex < activeIndex - 1 ? <Check size={10} /> : String(index + 1).padStart(2, '0')}</i>
                          <span>{item.label}<small>{item.phase === phase ? 'CURRENT PHASE' : destination.shortName}</small></span>
                        </div>
                      )
                    })}
                    <div className="flight-destination" style={{ '--dest-accent': destination.accent } as CSSProperties}>
                      <span>DESTINATION</span>
                      <strong style={{ color: destination.accent }}>{destination.name}</strong>
                      <small>{destination.conditions.split('·')[0].trim().toUpperCase()}</small>
                    </div>
                    <button className="skip-flight" onClick={completeIntro}><SkipForward size={14} /> Skip animation</button>
                  </aside>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="launch-footer">
            <div><Timer size={12} /> VISUALIZATION STATE</div>
            <div className="journey-stages">
              <span className="active">EARTH LAUNCH</span><i />
              <span>TRANSIT FLIGHT</span><i />
              <span>{destination.shortName} ORBIT</span><i />
              <span>OPERATIONS</span>
            </div>
            <div>SIMULATION</div>
          </footer>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
