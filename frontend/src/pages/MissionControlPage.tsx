import { Activity, AlertTriangle, BatteryCharging, CheckCircle2, Radio, RefreshCcw, Rocket, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LunarMap } from '../components/nexus/LunarMap'
import { ConnectionBadge, MethodDetails, MetricTile, MiniBar, MissionInformationPanel, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill, ValidationBadge } from '../components/nexus/NexusUI'
import { MISSION_CONFIG } from '../config/mission'
import { useNexusStore } from '../store/nexusStore'
import { NEXUS_STATUS_COLORS, SCENARIO_STAGES } from '../utils/nexusData'

export function MissionControlPage() {
  const navigate = useNavigate()
  const mission = useNexusStore(state => state.mission)
  const assets = useNexusStore(state => state.assets)
  const incidents = useNexusStore(state => state.incidents)
  const risk = useNexusStore(state => state.risk)
  const plan = useNexusStore(state => state.plan)
  const communication = useNexusStore(state => state.communication)
  const simulation = useNexusStore(state => state.simulation)
  const latest = useNexusStore(state => state.latestTelemetry['astra-1'])
  const injectNightfall = useNexusStore(state => state.injectNightfallRescue)
  const restoreNormalConditions = useNexusStore(state => state.restoreNormalConditions)
  const backendConnected = useNexusStore(state => state.backendConnected)
  const averageEnergy = assets.reduce((sum, asset) => sum + asset.energy, 0) / Math.max(1, assets.length)
  const atRisk = assets.filter(asset => asset.status !== 'normal').length
  const nightfallLoaded = simulation.activeScenario === 'lunar-nightfall-rescue'

  const handleNightfallAction = () => {
    if (nightfallLoaded) {
      navigate('/mission-council')
      return
    }
    injectNightfall()
  }

  return (
    <div className="nexus-page mission-control-page space-y-5">
      <PageHeading
        title="Mission Control"
        description={`${MISSION_CONFIG.name} · ${MISSION_CONFIG.operatingRegion} · ${mission.phase}. Review the fixed mission snapshot and load the contingency scenario when needed.`}
        actions={<><ConnectionBadge connected={backendConnected} /><button className="nexus-btn-primary" onClick={handleNightfallAction}>{nightfallLoaded ? <><Target size={14} /> Review Rescue Plan</> : <><Rocket size={14} /> Load Nightfall Rescue</>}</button></>}
      />

      {nightfallLoaded && (
        <div className="scenario-loaded-banner" role="status" aria-live="polite">
          <div><CheckCircle2 size={17} /><span><strong>Nightfall Rescue loaded</strong><small>Telemetry, mission risk, assets, and the council recommendation now reflect the contingency snapshot.</small></span></div>
          <button type="button" className="nexus-btn-secondary" onClick={restoreNormalConditions}><RefreshCcw size={14} /> Restore nominal snapshot</button>
        </div>
      )}

      <MissionInformationPanel />

      <div className="mission-metric-strip">
        <MetricTile label="Mission health" value={mission.overallHealth.toFixed(0)} unit="/100" accent={mission.overallHealth > 78 ? '#21d99a' : '#f5b942'} icon={<Activity size={12} />} methodKey="missionHealth" timestamp={latest.timestamp} />
        <MetricTile label="Mission success" value="Not calculated" accent="#94a3b8" icon={<Target size={12} />} methodKey="missionSuccess" timestamp={latest.timestamp} />
        <MetricTile label="Mean asset energy" value={averageEnergy.toFixed(0)} unit="%" accent="#f5b942" icon={<BatteryCharging size={12} />} methodKey="assetEnergy" timestamp={latest.timestamp} inputs={assets.map(asset => `${asset.name} ${asset.energy.toFixed(1)}%`)} />
        <MetricTile label="Mission risk" value={risk.score.toFixed(0)} unit="/100" accent={risk.score > 59 ? '#ff7a33' : '#21d99a'} icon={<AlertTriangle size={12} />} methodKey="missionRisk" timestamp={latest.timestamp} />
        <MetricTile label="Assets at risk" value={atRisk} unit={`/${assets.length}`} accent={atRisk ? '#f5b942' : '#21d99a'} icon={<AlertTriangle size={12} />} detail={`${incidents.length} active incident${incidents.length === 1 ? '' : 's'}`} />
      </div>

      <div className="control-room-layout">
        <NexusPanel className="control-asset-rail p-3">
          <div className="flex items-center justify-between"><h2 className="nexus-section-title">Mission assets</h2><SourceLabel>Scenario values</SourceLabel></div>
          <div className="mt-3 space-y-3">
            {assets.map(asset => (
              <article key={asset.id} className="control-asset-card">
                <div className="flex items-start justify-between gap-2"><div><strong>{asset.name}</strong><small>{asset.kind}</small></div><StatusPill status={asset.status} /></div>
                <dl><div><dt>Health</dt><dd>{asset.health.toFixed(0)}%</dd></div><div><dt>Energy</dt><dd>{asset.energy.toFixed(0)}%</dd></div><div><dt>Signal</dt><dd>{asset.communicationStrength.toFixed(0)}</dd></div></dl>
                <MiniBar value={asset.health} color={NEXUS_STATUS_COLORS[asset.status]} />
                <p>{asset.activity}</p>
              </article>
            ))}
          </div>
          <MethodDetails methodKey="componentHealth" timestamp={latest.timestamp} />
          <MethodDetails methodKey="telemetry" timestamp={latest.timestamp} compact />
        </NexusPanel>

        <NexusPanel className="control-map-panel p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div><h2 className="nexus-section-title">Lunar surface operations map</h2><p className="mt-1 text-xs text-slate-500">Synthetic terrain grid · select an asset marker</p></div>
            <SourceLabel>Simulated</SourceLabel>
          </div>
          <div className="control-map-stage"><LunarMap /></div>
        </NexusPanel>

        <aside className="control-decision-rail space-y-4">
          <NexusPanel className="p-4" accent={plan ? '#22d3ee' : '#21d99a'}>
            <div className="flex items-center justify-between"><h2 className="nexus-section-title">Current recommendation</h2><SourceLabel>Rule-based</SourceLabel></div>
            <h3 className="mt-3 text-base font-semibold text-slate-100">{mission.latestRecommendation}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">{plan ? `Use the reviewed high-sunlight route after ${MISSION_CONFIG.assets.support.name} confirms uncertain terrain cells.` : 'Continue the coordinated terrain survey while retaining the verified return corridor.'}</p>
            <div className="mt-4 grid grid-cols-2 gap-3"><div className="incident-stat"><span>Confidence</span><strong>[NEEDS METHOD]</strong></div><div className="incident-stat"><span>Approval</span><ValidationBadge valid={plan?.safetyValidated ?? true} /></div></div>
            <MethodDetails methodKey="agentConfidence" timestamp={latest.timestamp} />
          </NexusPanel>

          <NexusPanel className="p-4">
            <div className="flex items-center justify-between"><h2 className="nexus-section-title">Communication</h2><StatusPill status={communication.earthConnected ? 'normal' : 'critical'} label={communication.earthConnected ? 'connected' : 'blackout'} /></div>
            <dl className="control-facts"><div><dt>One-way delay</dt><dd>{communication.earthConnected ? `${communication.delaySeconds}s` : 'Unavailable'}</dd></div><div><dt>Local relay</dt><dd>{MISSION_CONFIG.assets.relay.name}</dd></div></dl>
            <SourceLabel>Scenario value</SourceLabel>
          </NexusPanel>

          <NexusPanel className="p-4">
            <div className="flex items-center justify-between"><h2 className="nexus-section-title">Scenario state</h2><span className="font-mono text-xs text-cyan-300">{simulation.scenarioStage}/8</span></div>
            <MiniBar value={(simulation.scenarioStage / 8) * 100} color={simulation.scenarioStage >= 6 ? '#ff7a33' : '#22d3ee'} />
            <p className="mt-3 text-xs text-slate-400">{SCENARIO_STAGES[simulation.scenarioStage]}</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Snapshot values remain fixed until a scenario control is used.</p>
          </NexusPanel>
        </aside>
      </div>

      <NexusPanel className="mission-phase-timeline p-4">
        <div className="flex items-center gap-2"><Radio size={13} className="text-cyan-300" /><h2 className="nexus-section-title">Mission phase timeline</h2></div>
        <ol>{MISSION_CONFIG.missionPhases.map((phase, index) => {
          const active = phase === mission.phase
          const completed = mission.phase === MISSION_CONFIG.missionPhases[4] ? index < 4 : index < 3
          return <li key={phase} className={active ? 'active' : completed ? 'completed' : ''}><span>{index + 1}</span><strong>{phase}</strong></li>
        })}</ol>
      </NexusPanel>

      <PageLimitation>The terrain grid and route overlay are synthetic; the route is a static frontend fixture unless backend A* output is loaded.</PageLimitation>
    </div>
  )
}
