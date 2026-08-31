import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowRight, Camera, GitBranch, Radar, Search, Sparkles } from 'lucide-react'
import { EvidenceLegend, MethodDetails, NexusPanel, PageHeading, PageLimitation, SeverityPill, SourceLabel, StatusPill } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'
import type { EvidenceKind } from '../types/nexus'
import { MISSION_CONFIG } from '../config/mission'

const KIND_COLORS: Record<EvidenceKind, string> = {
  verified_observation: '#38bdf8',
  detected_anomaly: '#ff7a33',
  inferred_cause: '#a78bfa',
  predicted_outcome: '#f5b942',
  recommended_action: '#21d99a',
}

export function IncidentIntelligencePage() {
  const incident = useNexusStore(state => state.incidents[0])
  const selectedNodeId = useNexusStore(state => state.selectedCausalNodeId)
  const selectNode = useNexusStore(state => state.selectCausalNode)
  const inject = useNexusStore(state => state.injectNightfallRescue)
  const latest = useNexusStore(state => state.latestTelemetry['astra-1'])
  const risk = useNexusStore(state => state.risk)
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0)

  useEffect(() => { if (!incident) inject() }, [])

  if (!incident) {
    return (
      <div className="nexus-page space-y-5">
        <PageHeading title="Incident Intelligence" description="Review how the system separates observations, rules, inferences, predictions and recommendations." />
        <NexusPanel className="flex min-h-[480px] flex-col items-center justify-center p-8 text-center">
          <Radar size={30} className="text-emerald-300" />
          <h2 className="mt-4 text-xl font-semibold text-slate-100">No incident loaded</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Load the fixed contingency snapshot to inspect its evidence and relationship methods.</p>
          <button className="nexus-btn-primary mt-5" onClick={inject}><Sparkles size={14} /> Load Nightfall Rescue</button>
        </NexusPanel>
      </div>
    )
  }

  const selectedNode = incident.causalNodes.find(node => node.id === selectedNodeId) ?? incident.causalNodes[0]
  const matchingEvidence = incident.evidence.filter(item => selectedNode.evidenceMetrics.includes(item.metric))
  const selectedLink = incident.causalLinks[Math.min(selectedLinkIndex, incident.causalLinks.length - 1)]
  const incidentSections = [
    ['Observation', incident.observation],
    ['Detection', incident.detectionMethod],
    ['Evidence', incident.supportingEvidence],
    ['Inference', incident.inference],
    ['Prediction', incident.prediction],
    ['Recommendation', incident.recommendation],
    ['Limitation', incident.limitation],
  ]

  return (
    <div className="nexus-page incident-analysis-page space-y-5">
      <PageHeading
        title="Incident Intelligence"
        description={`Trace the ${MISSION_CONFIG.incident.name} snapshot from raw observations to a reviewable recommendation. Relationship arrows identify their evidence type and method.`}
        actions={<div className="flex items-center gap-2"><SeverityPill severity={incident.severity} /><StatusPill status="warning" label={incident.status.replace(/_/g, ' ')} /></div>}
      />

      <div className="incident-summary-layout">
        <NexusPanel className="p-4" accent="#ff7a33">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><SourceLabel>Scenario incident</SourceLabel><h2 className="mt-3 text-xl font-semibold text-slate-100">{incident.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{incident.probableRootCause}</p></div>
            <div className="incident-confidence-block"><span>Incident confidence</span><strong>Not calculated</strong><MethodDetails methodKey="incidentConfidence" timestamp={incident.timestamp} compact /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="incident-stat"><span>Affected assets</span><strong>{incident.affectedAssets.length}</strong></div>
            <div className="incident-stat"><span>Components</span><strong>{incident.affectedComponents.length}</strong></div>
            <div className="incident-stat"><span>Mission risk</span><strong>{risk.score.toFixed(0)}/100</strong><MethodDetails methodKey="missionRisk" timestamp={latest.timestamp} compact /></div>
            <div className="incident-stat"><span>Data timestamp</span><strong>{new Date(latest.timestamp).toLocaleTimeString()}</strong></div>
          </div>
        </NexusPanel>

        <NexusPanel className="incident-method-panel p-4">
          <h2 className="nexus-section-title">Detection method</h2>
          <p className="mt-3 text-xs leading-5 text-slate-300">Threshold and cross-sensor rules are available in this snapshot. The backend also implements Isolation Forest; the local incident fixture is not hydrated from that backend result.</p>
          <MethodDetails methodKey="anomalyDetection" timestamp={incident.timestamp} />
        </NexusPanel>
      </div>

      <NexusPanel className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><h2 className="nexus-section-title">Incident record</h2><p className="mt-1 text-xs text-slate-500">Each statement is labelled by its role in the reasoning chain.</p></div>
          <SourceLabel>Rule-based scenario review</SourceLabel>
        </div>
        <dl className="incident-record-grid">{incidentSections.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </NexusPanel>

      <NexusPanel className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><h2 className="nexus-section-title">Incident Relationship Graph</h2><p className="mt-1 text-xs text-slate-500">Select a node for evidence or an arrow for relationship details.</p></div>
          <EvidenceLegend />
        </div>
        <div className="relationship-graph-wrap">
          <div className="relationship-graph">
            {incident.causalNodes.map((node, index) => (
              <div key={node.id} className="relationship-step">
                <button onClick={() => selectNode(node.id)} className={`causal-node ${selectedNode.id === node.id ? 'active' : ''}`} style={{ '--node-color': KIND_COLORS[node.kind] } as CSSProperties}>
                  <span style={{ color: KIND_COLORS[node.kind] }}>{node.kind.replace(/_/g, ' ')}</span>
                  <strong>{node.label}</strong>
                </button>
                {index < incident.causalLinks.length && (
                  <button className={`relationship-arrow ${selectedLinkIndex === index ? 'active' : ''}`} onClick={() => setSelectedLinkIndex(index)} aria-label={`Inspect relationship: ${incident.causalLinks[index].relation}`}>
                    <ArrowRight size={18} /><small>{incident.causalLinks[index].edgeType.replace(/_/g, ' ')}</small>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {selectedLink && (
          <aside className="relationship-drawer">
            <div><span>Relationship</span><strong>{selectedLink.relation}</strong></div>
            <div><span>Edge type</span><strong>{selectedLink.edgeType.replace(/_/g, ' ')}</strong></div>
            <div><span>Evidence</span><strong>{selectedLink.evidence.join('; ')}</strong></div>
            <div><span>Method</span><strong>{selectedLink.method}</strong></div>
            <div><span>Timestamp range</span><strong>{selectedLink.timestampRange}</strong></div>
            <div><span>Confidence method</span><strong>{selectedLink.confidenceMethod}</strong></div>
            <div><span>Limitation</span><strong>{selectedLink.limitation}</strong></div>
          </aside>
        )}
      </NexusPanel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <NexusPanel className="p-4" accent={KIND_COLORS[selectedNode.kind]}>
          <div className="flex items-start justify-between"><div><SourceLabel>{selectedNode.kind.replace(/_/g, ' ')}</SourceLabel><h3 className="mt-2 text-lg font-semibold text-slate-100">{selectedNode.label}</h3></div><GitBranch size={18} style={{ color: KIND_COLORS[selectedNode.kind] }} /></div>
          <p className="mt-3 text-xs leading-5 text-slate-400">{selectedNode.description}</p>
          <div className="mt-4 space-y-2">
            {matchingEvidence.length ? matchingEvidence.map(item => (
              <div key={item.metric} className="evidence-reading">
                <div><strong>{item.label}</strong><small>{item.kind.replace(/_/g, ' ')} · expected {item.expectedRange}</small></div>
                <b>{item.value.toFixed(2)} {item.unit}</b>
              </div>
            )) : <p className="rounded-lg bg-white/[0.025] p-3 text-xs text-slate-500">This inferred node has no direct sensor value. Inspect an adjacent observation node for measured evidence.</p>}
          </div>
        </NexusPanel>

        <div className="space-y-4">
          <NexusPanel className="p-4">
            <h2 className="nexus-section-title">Alternative causes</h2>
            <div className="mt-3 space-y-2">{incident.alternativeCauses.map(cause => <div key={cause} className="alternative-cause"><span>{cause}</span><SourceLabel>Unranked</SourceLabel></div>)}</div>
          </NexusPanel>
          <NexusPanel className="p-4">
            <div className="flex items-center gap-2"><Camera size={14} className="text-cyan-300" /><h2 className="nexus-section-title">Next observation</h2></div>
            <p className="mt-3 text-xs leading-5 text-slate-300">{incident.recommendedObservation}</p>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">Missing: {incident.missingInformation.join(' ')}</p>
          </NexusPanel>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">{['Threshold rules', 'Cross-sensor rule', 'Backend Isolation Forest', 'Data-quality checks'].map(item => <span key={item} className="method-chip"><Search size={10} />{item}</span>)}</div>
      <PageLimitation>The relationship graph documents prototype rules and assumptions; it does not prove physical causation.</PageLimitation>
    </div>
  )
}
