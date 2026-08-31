import { Radio, Rocket } from 'lucide-react'
import { MISSION_CONFIG } from '../../config/mission'
import { LunarMap } from '../nexus/LunarMap'

/**
 * Kept as a compatibility wrapper for callers created before the mission audit.
 * The active view now represents only the Earth-to-Moon mission and lunar surface.
 */
export function SpaceMissionMap() {
  return (
    <div className="space-map-shell lunar-only-map">
      <LunarMap />
      <div className="map-link-status">
        <Radio size={12} />
        <span>EARTH LINK</span>
        <strong>{MISSION_CONFIG.communicationDelaySeconds}s one-way scenario value</strong>
      </div>
      <div className="map-object-card lunar-mission-card">
        <div className="map-object-eyebrow"><Rocket size={12} /> ACTIVE MISSION</div>
        <h3>{MISSION_CONFIG.name}</h3>
        <p>{MISSION_CONFIG.destination} · {MISSION_CONFIG.operatingRegion}</p>
        <div className="map-object-objective">{MISSION_CONFIG.objective}</div>
      </div>
    </div>
  )
}
