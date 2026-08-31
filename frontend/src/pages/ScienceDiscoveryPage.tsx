import { BatteryCharging, Clock3, FlaskConical, Microscope, Satellite, ShieldAlert, Target } from 'lucide-react'
import { LunarMap } from '../components/nexus/LunarMap'
import { MethodDetails, MiniBar, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'

function opportunityScore(value: number, confidence: number, risk: number, energy: number) {
  return Math.round(value * 0.48 + confidence * 100 * 0.28 - risk * 0.18 - Math.min(100, energy) * 0.06)
}

export function ScienceDiscoveryPage() {
  const opportunities = useNexusStore(state => state.opportunities)
  const decide = useNexusStore(state => state.decideScienceOpportunity)
  const stage = useNexusStore(state => state.simulation.scenarioStage)
  const council = useNexusStore(state => state.council)
  const timestamp = useNexusStore(state => state.latestTelemetry['astra-1'].timestamp)
  const scienceOfficer = council.find(agent => agent.role === 'SCIENCE_OFFICER')
  const selected = [...opportunities].sort((a, b) => opportunityScore(b.scientificValue, b.confidence, b.missionRisk, b.requiredEnergy) - opportunityScore(a.scientificValue, a.confidence, a.missionRisk, a.requiredEnergy))[0]

  return (
    <div className="nexus-page science-review-page space-y-5">
      <PageHeading
        title="Science Opportunity Review"
        description="Compare lunar science candidates with their scenario evidence, required energy and mission-risk trade-offs before recording a decision."
        actions={<div className="static-page-badge"><Satellite size={14} /> {opportunities.length} candidate locations</div>}
      />

      <div className="science-task-layout">
        <NexusPanel className="science-map-panel p-3">
          <div className="mb-3 flex items-center justify-between"><h2 className="nexus-section-title">Candidate region</h2><SourceLabel>Synthetic map</SourceLabel></div>
          <div className="h-[420px]"><LunarMap /></div>
        </NexusPanel>

        <section className="science-candidate-list">
          <div className="mb-3 flex items-center justify-between"><h2 className="nexus-section-title">Candidate locations</h2><MethodDetails methodKey="scienceScore" timestamp={timestamp} compact /></div>
          <div className="space-y-3">
            {opportunities.map((item, index) => {
              const score = opportunityScore(item.scientificValue, item.confidence, item.missionRisk, item.requiredEnergy)
              const color = ['#22d3ee', '#a78bfa', '#21d99a'][index]
              return (
                <NexusPanel key={item.id} className="science-candidate-card p-4" accent={color}>
                  <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2" style={{ color }}><Microscope size={16} /><strong>{item.title}</strong></div><StatusPill status={item.decision === 'investigate' ? 'normal' : item.decision === 'defer' ? 'warning' : 'offline'} label={item.decision} /></div>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">{item.assetId} signal</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <ScienceMetric icon={<Target size={10} />} label="Value" value={`${item.scientificValue}/100`} />
                    <ScienceMetric icon={<BatteryCharging size={10} />} label="Energy" value={`${item.requiredEnergy} Wh`} />
                    <ScienceMetric icon={<Clock3 size={10} />} label="Time" value={`${item.timeCostMinutes}m`} />
                    <ScienceMetric icon={<ShieldAlert size={10} />} label="Risk" value={`${item.missionRisk}/100`} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-500">Opportunity score</span><strong className="font-mono" style={{ color }}>{score}/100</strong></div><MiniBar value={score} color={color} />
                  <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-slate-400">Input confidence {Math.round(item.confidence * 100)}%</span><SourceLabel>Scenario value</SourceLabel></div>
                  <div className="mt-3 flex gap-2"><button className="nexus-btn-success flex-1 justify-center" onClick={() => decide(item.id, 'investigate')} disabled={item.decision === 'investigate'}>Investigate</button><button className="nexus-btn-secondary flex-1 justify-center" onClick={() => decide(item.id, 'defer')} disabled={item.decision === 'defer'}>Defer</button></div>
                </NexusPanel>
              )
            })}
          </div>
        </section>

        <aside className="science-evidence-column space-y-4">
          <NexusPanel className="p-4" accent="#21d99a">
            <div className="flex items-center gap-2"><FlaskConical size={15} className="text-emerald-300" /><h2 className="nexus-section-title">Highest scoring candidate</h2></div>
            <h3 className="mt-3 text-base font-semibold text-slate-100">{selected.title}</h3>
            <div className="mt-3 space-y-2">{selected.supportingData.map(value => <div key={value} className="evidence-reading"><div><strong>Scenario evidence</strong><small>{selected.assetId}</small></div><b>{value}</b></div>)}</div>
            <p className="mt-3 text-xs leading-5 text-slate-300">{selected.recommendation}</p>
          </NexusPanel>
          <NexusPanel className="p-4"><h2 className="nexus-section-title">Science Officer finding</h2><p className="mt-3 text-xs leading-5 text-slate-300">{scienceOfficer?.finding ?? 'Passive monitoring may continue without changing the safe route.'}</p><p className="mt-3 text-[11px] leading-5 text-slate-500">{scienceOfficer?.limitation ?? 'No instrument-confirmed sample is available.'}</p><MethodDetails methodKey="agentAssessment" timestamp={timestamp} /></NexusPanel>
          <NexusPanel className="p-4" accent={stage >= 5 ? '#ff7a33' : '#22d3ee'}><h2 className="nexus-section-title">Mission-risk guardrail</h2><p className="mt-3 text-xs leading-5 text-slate-400">{stage >= 5 ? 'Physical sampling is deferred while recovery takes priority. Coordinates and raw sensor products remain in the simulation record.' : 'Passive observations remain inside the scenario envelope. Physical sampling still requires operator review.'}</p></NexusPanel>
        </aside>
      </div>

      <PageLimitation>Candidate values, confidence inputs and supporting evidence are scenario fixtures awaiting instrument confirmation.</PageLimitation>
    </div>
  )
}

function ScienceMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg bg-white/[0.025] p-2"><div className="flex items-center gap-1 text-[9px] text-slate-500">{icon}{label}</div><div className="mt-1 font-mono text-xs text-slate-200">{value}</div></div>
}
