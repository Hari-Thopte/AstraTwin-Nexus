import { useMemo, useState } from 'react'
import { Activity, ArrowRight, BrainCircuit, Database, GitBranch, History, Link2, Search, ShieldCheck } from 'lucide-react'
import { MethodDetails, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'
import { MEMORY_LINKS, MEMORY_NODES, NEXUS_STATUS_COLORS, TIMELINE_EVENTS, createAssets, createTelemetry } from '../utils/nexusData'
import { MISSION_CONFIG } from '../config/mission'

const NODE_COLORS = {
  asset: '#22d3ee', component: '#38bdf8', telemetry: '#8b5cf6', incident: '#ff7a33', cause: '#a78bfa',
  constraint: '#f5b942', science: '#21d99a', recommendation: '#2dd4bf', decision: '#f472b6', outcome: '#21d99a',
}

export function MissionMemoryPage() {
  const [selectedNodeId, setSelectedNodeId] = useState('incident-nightfall')
  const [assetFilter, setAssetFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const rewindIndex = useNexusStore(state => state.rewindIndex)
  const setRewindIndex = useNexusStore(state => state.setRewindIndex)
  const simulation = useNexusStore(state => state.simulation)
  const mission = useNexusStore(state => state.mission)
  const audit = useNexusStore(state => state.audit)
  const selectedNode = MEMORY_NODES.find(node => node.id === selectedNodeId) ?? MEMORY_NODES[0]
  const previewReadings = useMemo(() => createTelemetry(simulation.tick, rewindIndex, mission.elapsedSeconds, simulation.seed), [simulation.tick, rewindIndex, mission.elapsedSeconds, simulation.seed])
  const previewAssets = useMemo(() => createAssets(rewindIndex, previewReadings), [rewindIndex, previewReadings])
  const previewAstra = previewAssets[0]
  const previewMetrics = previewReadings['astra-1'].metrics
  const visibleNodes = MEMORY_NODES.filter(node => {
    const sourceMatches = sourceFilter === 'all' || node.type === sourceFilter
    const assetMatches = assetFilter === 'all' || node.label.toLowerCase().includes(assetFilter)
    return sourceMatches && assetMatches
  })
  const visibleIds = new Set(visibleNodes.map(node => node.id))

  return (
    <div className="nexus-page space-y-5">
      <PageHeading
        title="Mission Memory"
        description="Filter the scenario evidence graph, inspect source identifiers and rewind the fixed incident timeline."
        actions={<div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-200"><Database size={14} /> {MEMORY_NODES.length} linked mission entities</div>}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <NexusPanel className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="nexus-section-title">Mission evidence graph</div><div className="text-[11px] text-slate-500">Select a node to inspect its source identifiers</div></div><div className="memory-filters"><label>Asset<select value={assetFilter} onChange={event => setAssetFilter(event.target.value)}><option value="all">All</option><option value={MISSION_CONFIG.assets.primary.id}>{MISSION_CONFIG.assets.primary.name}</option><option value={MISSION_CONFIG.assets.support.id}>{MISSION_CONFIG.assets.support.name}</option><option value={MISSION_CONFIG.assets.relay.id}>{MISSION_CONFIG.assets.relay.name}</option></select></label><label>Source<select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option value="all">All</option><option value="telemetry">Telemetry</option><option value="incident">Incident</option><option value="recommendation">Recommendation</option><option value="decision">Decision</option></select></label><button onClick={() => { setAssetFilter('all'); setSourceFilter('all') }}>Clear</button></div></div>
          <div className="relative mt-4 h-[430px] overflow-hidden rounded-xl border border-white/[0.05] bg-[#070d17]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs><filter id="memoryGlow"><feGaussianBlur stdDeviation=".5" /></filter></defs>
              {MEMORY_LINKS.filter(link => visibleIds.has(link.source) && visibleIds.has(link.target)).map(link => {
                const source = MEMORY_NODES.find(node => node.id === link.source)!
                const target = MEMORY_NODES.find(node => node.id === link.target)!
                return <g key={`${link.source}-${link.target}`}><line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#3c6d88" strokeOpacity=".45" strokeWidth=".45" strokeDasharray="1.6 1" /><text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 1.2} fill="#607089" fontSize="1.6" textAnchor="middle">{link.relation}</text></g>
              })}
            </svg>
            {visibleNodes.map(node => {
              const color = NODE_COLORS[node.type]
              return <button key={node.id} onClick={() => setSelectedNodeId(node.id)} className={`memory-node ${selectedNodeId === node.id ? 'active' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%`, '--memory-color': color } as React.CSSProperties}><span>{node.type}</span><strong>{node.label}</strong></button>
            })}
          </div>
        </NexusPanel>

        <div className="space-y-4">
          <NexusPanel className="p-4" accent={NODE_COLORS[selectedNode.type]}>
            <div className="flex items-start justify-between"><div><div className="nexus-eyebrow">{selectedNode.type}</div><h2 className="mt-1 text-lg font-semibold text-slate-100">{selectedNode.label}</h2></div><Link2 size={17} style={{ color: NODE_COLORS[selectedNode.type] }} /></div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.12em] text-slate-500">Traceable evidence identifiers</div>
            <div className="mt-2 flex flex-wrap gap-2">{selectedNode.evidenceIds.map(id => <span key={id} className="method-chip"><Search size={10} />{id}</span>)}</div>
            <div className="mt-4 space-y-2">
              {MEMORY_LINKS.filter(link => link.source === selectedNode.id || link.target === selectedNode.id).map(link => {
                const outgoing = link.source === selectedNode.id
                const other = MEMORY_NODES.find(node => node.id === (outgoing ? link.target : link.source))!
                return <div key={`${link.source}-${link.target}`} className="flex items-center gap-2 rounded-lg bg-white/[0.025] p-2.5 text-[11px] text-slate-400"><span>{outgoing ? selectedNode.label : other.label}</span><ArrowRight size={11} className={outgoing ? '' : 'rotate-180'} /><span className="text-cyan-300">{link.relation}</span><ArrowRight size={11} /><span>{outgoing ? other.label : selectedNode.label}</span></div>
              })}
            </div>
          </NexusPanel>
          <NexusPanel className="p-4">
            <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-300" /><div className="nexus-section-title">Evidence integrity</div></div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span>Integrity score</span><strong className="text-slate-200">Not calculated</strong></div>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">The graph stores scenario identifiers but does not implement cryptographic integrity or completeness scoring.</p>
            <MethodDetails methodKey="evidenceIntegrity" compact />
          </NexusPanel>
        </div>
      </div>

      <NexusPanel className="p-4" accent="#22d3ee">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><History size={15} className="text-cyan-300" /><div className="nexus-section-title">Mission rewind</div></div><div className="mt-1 text-[11px] text-slate-500">Scrub the incident timeline to preview telemetry and twin status at that moment</div></div><StatusPill status={previewAstra.status} label={`state ${rewindIndex}/8`} /></div>
        <div className="mt-5">
          <input type="range" min={0} max={8} step={1} value={rewindIndex} onChange={event => setRewindIndex(Number(event.target.value))} className="nexus-range" />
          <div className="mt-2 grid grid-cols-9 gap-1">{TIMELINE_EVENTS.map(event => <button key={event.id} onClick={() => setRewindIndex(event.stage)} className={`timeline-dot ${event.stage <= rewindIndex ? 'passed' : ''} ${event.stage === rewindIndex ? 'active' : ''}`} title={event.label}><span>{event.stage}</span></button>)}</div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
            <div className="nexus-eyebrow">Timeline moment</div><h3 className="mt-1 text-lg font-semibold text-slate-100">{TIMELINE_EVENTS[rewindIndex].label}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{TIMELINE_EVENTS[rewindIndex].detail}</p>
            <div className="mt-4 grid grid-cols-3 gap-3"><PreviewMetric label="Astra health" value={`${previewAstra.health.toFixed(0)}%`} color={NEXUS_STATUS_COLORS[previewAstra.status]} /><PreviewMetric label="Motor temp" value={`${previewMetrics.motorTemperature.toFixed(1)}°C`} color="#ff7a33" /><PreviewMetric label="Battery" value={`${previewMetrics.battery.toFixed(1)}%`} color="#f5b942" /></div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
            <div className="flex items-center gap-2"><Activity size={14} className="text-purple-300" /><div className="nexus-section-title">Events known by this moment</div></div>
            <div className="mt-3 space-y-2">{TIMELINE_EVENTS.slice(0, rewindIndex + 1).slice(-4).map(event => <div key={event.id} className="flex items-start gap-2 text-xs text-slate-400"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" /><div><span className="text-slate-200">{event.label}</span><div className="mt-0.5 text-[10px] text-slate-500">{event.detail}</div></div></div>)}</div>
          </div>
        </div>
        <MethodDetails methodKey="telemetry" timestamp={previewReadings['astra-1'].timestamp} inputs={[`Seed ${simulation.seed}`, `Timeline stage ${rewindIndex}`]} />
      </NexusPanel>

      <NexusPanel className="p-4">
        <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><BrainCircuit size={14} className="text-purple-300" /><div className="nexus-section-title">Recent simulation audit events</div></div><SourceLabel>In-memory session log</SourceLabel></div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{audit.slice(0, 6).map(item => <div key={item.id} className="rounded-lg bg-white/[0.025] p-3"><div className="text-[9px] uppercase text-slate-500">{item.action.replace(/_/g, ' ')}</div><div className="mt-1 text-[11px] leading-4 text-slate-300">{item.details}</div></div>)}</div>
      </NexusPanel>
      <PageLimitation>The evidence graph and audit list are held in frontend memory and are not an immutable flight record.</PageLimitation>
    </div>
  )
}

function PreviewMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return <div><div className="text-[9px] uppercase text-slate-500">{label}</div><div className="mt-1 font-mono text-lg" style={{ color }}>{value}</div></div>
}
