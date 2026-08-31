import { Cpu, Info, MousePointer2, Rotate3D } from 'lucide-react'
import { TwinScene } from '../components/nexus/TwinScene'
import { MethodDetails, MiniBar, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'
import { NEXUS_STATUS_COLORS } from '../utils/nexusData'

export function DigitalTwinPage() {
  const assets = useNexusStore(state => state.assets)
  const selectedAssetId = useNexusStore(state => state.selectedAssetId)
  const selectedComponentId = useNexusStore(state => state.selectedComponentId)
  const selectAsset = useNexusStore(state => state.selectAsset)
  const selectComponent = useNexusStore(state => state.selectComponent)
  const history = useNexusStore(state => state.telemetryHistory[selectedAssetId])
  const selectedAsset = assets.find(asset => asset.id === selectedAssetId) ?? assets[0]
  const selectedComponent = selectedAsset.components.find(component => component.id === selectedComponentId)
  const latest = history[history.length - 1]

  return (
    <div className="nexus-page twin-inspection-page space-y-5">
      <PageHeading
        title="Digital Twin Inspection"
        description="Select an asset and component to inspect its deterministic health state alongside the seeded telemetry snapshot that supports it."
        actions={<div className="static-page-badge"><Rotate3D size={14} /> Drag to rotate · scroll to zoom</div>}
      />

      <div className="twin-inspection-layout">
        <NexusPanel className="twin-tree-panel p-3">
          <div className="flex items-center justify-between"><h2 className="nexus-section-title">Component tree</h2><SourceLabel>Calculated</SourceLabel></div>
          <div className="mt-3 space-y-3">
            {assets.map(asset => (
              <div key={asset.id} className={`twin-tree-asset ${selectedAssetId === asset.id ? 'active' : ''}`}>
                <button onClick={() => selectAsset(asset.id)}><span style={{ background: NEXUS_STATUS_COLORS[asset.status] }} /><strong>{asset.name}</strong><small>{asset.kind}</small></button>
                {selectedAssetId === asset.id && <div className="twin-tree-components">{asset.components.map(component => <button key={component.id} className={selectedComponentId === component.id ? 'active' : ''} onClick={() => selectComponent(component.id)}><span style={{ background: NEXUS_STATUS_COLORS[component.status] }} />{component.name}<b>{component.health.toFixed(0)}%</b></button>)}</div>}
              </div>
            ))}
          </div>
          <MethodDetails methodKey="componentHealth" timestamp={latest?.timestamp} />
        </NexusPanel>

        <NexusPanel className="twin-viewer-panel p-2" accent="#22d3ee">
          <div className="twin-viewer-label"><MousePointer2 size={13} /> Select an illuminated component</div>
          <TwinScene />
        </NexusPanel>

        <NexusPanel className="twin-detail-panel p-4" accent={NEXUS_STATUS_COLORS[selectedAsset.status]}>
          <div className="flex items-start justify-between gap-3"><div><SourceLabel>Scenario state</SourceLabel><h2 className="mt-2 text-xl font-semibold text-slate-100">{selectedAsset.name}</h2><p className="mt-1 text-xs text-slate-500">{selectedAsset.kind} · {selectedAsset.coordinates[0].toFixed(3)}°, {selectedAsset.coordinates[1].toFixed(3)}°</p></div><StatusPill status={selectedAsset.status} /></div>
          <dl className="twin-asset-facts"><div><dt>Health</dt><dd>{selectedAsset.health.toFixed(0)}%</dd></div><div><dt>Energy</dt><dd>{selectedAsset.energy.toFixed(0)}%</dd></div><div><dt>Signal</dt><dd>{selectedAsset.communicationStrength.toFixed(0)}</dd></div></dl>
          <MiniBar value={selectedAsset.health} color={NEXUS_STATUS_COLORS[selectedAsset.status]} />
          <p className="mt-3 rounded-lg bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">{selectedAsset.activity}</p>
          <div className="mt-5 border-t border-white/[0.07] pt-4">
            <div className="flex items-center gap-2"><Cpu size={14} className="text-cyan-300" /><h3 className="nexus-section-title">Selected component</h3></div>
            {selectedComponent ? <div className="mt-3"><div className="flex items-center justify-between"><strong className="text-sm text-slate-100">{selectedComponent.name}</strong><StatusPill status={selectedComponent.status} /></div><p className="mt-2 text-xs leading-5 text-slate-400">{selectedComponent.evidence}</p><div className="mt-3 font-mono text-2xl" style={{ color: NEXUS_STATUS_COLORS[selectedComponent.status] }}>{selectedComponent.health.toFixed(1)}%</div><SourceLabel>Rule-based health</SourceLabel></div> : <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500"><Info size={13} className="mt-0.5 shrink-0" />Choose a component from the tree or viewer.</p>}
          </div>
        </NexusPanel>
      </div>

      <NexusPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="nexus-section-title">Telemetry timeline</h2><p className="mt-1 text-xs text-slate-500">Last eight fixed samples for {selectedAsset.name}</p></div><SourceLabel>Seeded simulation</SourceLabel></div>
        <div className="twin-timeline">{history.slice(-8).map((reading, index) => <div key={reading.id}><span>{new Date(reading.timestamp).toLocaleTimeString()}</span><i className={reading.missingMetrics.length ? 'missing' : reading.outlierMetrics.length ? 'outlier' : ''} /><strong>Sample {history.length - 7 + index}</strong><small>{reading.missingMetrics.length ? `${reading.missingMetrics.length} missing` : reading.outlierMetrics.length ? `${reading.outlierMetrics.length} outlier` : 'complete'}</small></div>)}</div>
        <MethodDetails methodKey="telemetry" timestamp={latest?.timestamp} />
      </NexusPanel>

      <PageLimitation>The 3D geometry is illustrative, and component health rules are not validated degradation models.</PageLimitation>
    </div>
  )
}
