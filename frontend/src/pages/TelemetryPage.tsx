import { useMemo, useState } from 'react'
import { Database, LockKeyhole, RadioTower, RefreshCcw, RotateCcw, Siren } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MethodDetails, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'
import type { AssetId, NexusStatus } from '../types/nexus'
import { NEXUS_STATUS_COLORS, SCENARIO_STAGES } from '../utils/nexusData'

interface SensorDefinition {
  label: string
  unit: string
  range: [number, number]
  decimals?: number
}

const SENSOR_CATALOG: Record<string, SensorDefinition> = {
  battery: { label: 'Battery reserve', unit: '%', range: [20, 100], decimals: 1 },
  solarOutput: { label: 'Solar output', unit: 'W', range: [60, 180], decimals: 1 },
  wheelResistance: { label: 'Wheel resistance', unit: 'N', range: [0, 42], decimals: 1 },
  wheelVibration: { label: 'Wheel vibration', unit: 'mm/s', range: [0, 3.5], decimals: 2 },
  motorTemperature: { label: 'Motor temperature', unit: '°C', range: [-20, 58], decimals: 1 },
  motorCurrent: { label: 'Motor current', unit: 'A', range: [0, 10], decimals: 2 },
  communicationStrength: { label: 'Signal strength', unit: 'dBm', range: [-85, -35], decimals: 1 },
  terrainSlope: { label: 'Terrain slope', unit: '°', range: [0, 18], decimals: 1 },
  radiation: { label: 'Radiation', unit: 'mSv/h', range: [0, 1], decimals: 3 },
  speed: { label: 'Traverse speed', unit: 'm/s', range: [0, 0.8], decimals: 2 },
  remainingOperatingMinutes: { label: 'Operating time estimate', unit: 'min', range: [0, 300], decimals: 0 },
  safeZoneDistance: { label: 'Safe-zone distance', unit: 'km', range: [0, 5], decimals: 2 },
  altitude: { label: 'Altitude', unit: 'm', range: [0, 180], decimals: 1 },
  flightStability: { label: 'Flight stability', unit: '%', range: [80, 100], decimals: 1 },
  signalStrength: { label: 'Signal strength', unit: 'dBm', range: [-85, -35], decimals: 1 },
  distanceFromRover: { label: 'Distance from rover', unit: 'km', range: [0, 8], decimals: 2 },
  terrainScanCoverage: { label: 'Terrain scan coverage', unit: '%', range: [0, 100], decimals: 1 },
  cameraCondition: { label: 'Camera condition', unit: '%', range: [70, 100], decimals: 1 },
  availableEnergy: { label: 'Available energy', unit: '%', range: [35, 100], decimals: 1 },
  relaySignalStrength: { label: 'Relay signal', unit: 'dBm', range: [-85, -35], decimals: 1 },
  communicationAvailability: { label: 'Earth-link availability', unit: '%', range: [20, 100], decimals: 1 },
  dataStorageCapacity: { label: 'Storage free', unit: '%', range: [10, 100], decimals: 1 },
  relayReadiness: { label: 'Relay readiness', unit: '%', range: [75, 100], decimals: 1 },
  thermalCondition: { label: 'Internal temperature', unit: '°C', range: [-20, 42], decimals: 1 },
}

const ASSET_SENSOR_GROUPS: Record<AssetId, string[][]> = {
  'astra-1': [
    ['battery', 'solarOutput'],
    ['wheelResistance', 'wheelVibration'],
    ['motorTemperature', 'motorCurrent'],
    ['communicationStrength'],
    ['terrainSlope', 'radiation'],
  ],
  nova: [['battery'], ['altitude', 'flightStability'], ['signalStrength', 'distanceFromRover'], ['terrainScanCoverage', 'cameraCondition']],
  selene: [['availableEnergy', 'dataStorageCapacity'], ['relaySignalStrength', 'relayReadiness'], ['communicationAvailability'], ['thermalCondition']],
}

function readingStatus(value: number, definition: SensorDefinition, missing: boolean, outlier: boolean): NexusStatus {
  if (missing) return 'offline'
  if (outlier || value < definition.range[0] || value > definition.range[1]) return 'warning'
  return 'normal'
}

export function TelemetryPage() {
  const assets = useNexusStore(state => state.assets)
  const selectedAssetId = useNexusStore(state => state.selectedAssetId)
  const selectAsset = useNexusStore(state => state.selectAsset)
  const history = useNexusStore(state => state.telemetryHistory[selectedAssetId])
  const latest = useNexusStore(state => state.latestTelemetry[selectedAssetId])
  const simulation = useNexusStore(state => state.simulation)
  const setSeed = useNexusStore(state => state.setSimulationSeed)
  const reset = useNexusStore(state => state.resetSimulation)
  const injectNightfall = useNexusStore(state => state.injectNightfallRescue)
  const injectBlackout = useNexusStore(state => state.injectCommunicationBlackout)
  const restore = useNexusStore(state => state.restoreNormalConditions)
  const [seedDraft, setSeedDraft] = useState(String(simulation.seed))
  const [groupIndex, setGroupIndex] = useState(0)
  const [sampleWindow, setSampleWindow] = useState(32)
  const [showRaw, setShowRaw] = useState(false)
  const selectedAsset = assets.find(asset => asset.id === selectedAssetId) ?? assets[0]
  const groups = ASSET_SENSOR_GROUPS[selectedAssetId]
  const activeKeys = groups[Math.min(groupIndex, groups.length - 1)]
  const previous = history[history.length - 2]

  const chartData = useMemo(() => history.slice(-sampleWindow).map((reading, index, readings) => {
    const row: Record<string, string | number | null> = {
      sample: history.length - readings.length + index + 1,
      time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      stage: reading.scenarioStage,
    }
    for (const key of activeKeys) row[key] = reading.missingMetrics.includes(key) ? null : reading.metrics[key]
    return row
  }), [activeKeys, history, sampleWindow])
  const eventRow = chartData.find(row => Number(row.stage) >= 6)
  const eventSample = eventRow ? Number(eventRow.sample) : undefined

  const loadSeed = () => {
    const value = Number(seedDraft)
    setSeed(Number.isFinite(value) ? value : simulation.seed)
  }

  return (
    <div className="nexus-page telemetry-analysis-page space-y-5">
      <PageHeading
        title="Telemetry Analysis"
        description="Inspect a fixed, reproducible sensor dataset with units, operating ranges, gaps, outliers and calculation provenance. Values change only when you load a seed or scenario snapshot."
        actions={<div className="static-page-badge"><LockKeyhole size={12} /> Static snapshot</div>}
      />

      <div className="telemetry-toolbar">
        <div className="seed-control">
          <label htmlFor="telemetry-seed"><Database size={13} /> Simulation seed</label>
          <input id="telemetry-seed" inputMode="numeric" value={seedDraft} onChange={event => setSeedDraft(event.target.value)} />
          <button className="nexus-btn-secondary" onClick={loadSeed}>Load seed</button>
        </div>
        <SourceLabel>Seeded simulation</SourceLabel>
        <div className="telemetry-actions">
          <button className="nexus-btn-secondary" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button className="nexus-btn-alert" onClick={injectNightfall}><Siren size={14} /> Nightfall rescue</button>
          <button className="nexus-btn-secondary" onClick={injectBlackout}><RadioTower size={14} /> Comm blackout</button>
          <button className="nexus-btn-secondary" onClick={restore}><RefreshCcw size={14} /> Normal</button>
        </div>
        <p>Generated telemetry uses a seeded simulation. It is not live spacecraft data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {assets.map(asset => (
          <button key={asset.id} className={`asset-tab ${selectedAssetId === asset.id ? 'active' : ''}`} onClick={() => { selectAsset(asset.id); setGroupIndex(0) }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: NEXUS_STATUS_COLORS[asset.status] }} />{asset.name}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">Stage {simulation.scenarioStage}/8 · {SCENARIO_STAGES[simulation.scenarioStage]}</span>
      </div>

      <div className="telemetry-analysis-layout">
        <NexusPanel className="telemetry-sensor-list p-3">
          <h2 className="nexus-section-title">Sensor groups</h2>
          <div className="mt-3 space-y-2">
            {groups.map((keys, index) => (
              <button key={keys.join('-')} className={groupIndex === index ? 'active' : ''} onClick={() => setGroupIndex(index)}>
                <span>{keys.map(key => SENSOR_CATALOG[key]?.label ?? key).join(' + ')}</span>
                <small>{keys.map(key => SENSOR_CATALOG[key]?.unit ?? '').join(' / ')}</small>
              </button>
            ))}
          </div>
        </NexusPanel>

        <NexusPanel className="telemetry-chart-panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="nexus-section-title">{activeKeys.map(key => SENSOR_CATALOG[key]?.label ?? key).join(' and ')}</h2>
              <p className="mt-1 text-xs text-slate-500">{selectedAsset.name} · 32 fixed samples · gaps are not connected</p>
            </div>
            <div className="flex flex-wrap items-center gap-2"><div className="time-range-controls" aria-label="Telemetry sample range">{[12, 24, 32].map(value => <button key={value} className={sampleWindow === value ? 'active' : ''} onClick={() => setSampleWindow(value)}>Last {value}</button>)}</div><SourceLabel>Simulated · seed {latest.seed}</SourceLabel></div>
          </div>
          <div className="mt-4 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 14, left: -10, bottom: 4 }}>
                <CartesianGrid stroke="rgba(148,163,184,.08)" strokeDasharray="3 4" />
                <XAxis dataKey="sample" tick={{ fill: '#718096', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#718096', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#0a1422', border: '1px solid rgba(148,163,184,.18)', borderRadius: 8, fontSize: 11 }} labelFormatter={label => `Sample ${label}`} />
                {activeKeys.map((key, index) => {
                  const definition = SENSOR_CATALOG[key]
                  return <Line key={key} type="linear" dataKey={key} name={`${definition?.label ?? key} (${definition?.unit ?? ''})`} stroke={index ? '#a78bfa' : '#22d3ee'} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
                })}
                {activeKeys.length === 1 && <ReferenceLine y={SENSOR_CATALOG[activeKeys[0]].range[1]} stroke="#f5b942" strokeDasharray="4 3" label={{ value: 'upper range', fill: '#f5b942', fontSize: 9 }} />}
                {eventSample !== undefined && <ReferenceLine x={eventSample} stroke="#ff7a33" strokeDasharray="3 3" label={{ value: 'incident', fill: '#ff9d63', fontSize: 9 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <MethodDetails methodKey="telemetry" timestamp={latest.timestamp} inputs={[`Seed ${latest.seed}`, `Sample ${history.length}`, `Stage ${latest.scenarioStage}`]} />
        </NexusPanel>

        <NexusPanel className="telemetry-current-panel p-4">
          <div className="flex items-center justify-between"><h2 className="nexus-section-title">Latest readings</h2><SourceLabel>Raw values</SourceLabel></div>
          <div className="mt-3 space-y-2">
            {Object.entries(latest.metrics).map(([key, value]) => {
              const definition = SENSOR_CATALOG[key] ?? { label: key, unit: '', range: [-Infinity, Infinity], decimals: 2 }
              const missing = latest.missingMetrics.includes(key)
              const outlier = latest.outlierMetrics.includes(key)
              const status = readingStatus(value, definition, missing, outlier)
              const oldValue = previous?.metrics[key] ?? value
              const trend = missing ? 'missing' : value > oldValue ? 'rising' : value < oldValue ? 'falling' : 'stable'
              return (
                <div key={key} className="telemetry-reading-row">
                  <div><strong>{definition.label}</strong><small>Range {Number.isFinite(definition.range[0]) ? definition.range.join(' to ') : 'not documented'} {definition.unit}</small></div>
                  <div><b>{missing ? 'No reading' : `${value.toFixed(definition.decimals ?? 1)} ${definition.unit}`}</b><small>{trend}{outlier ? ' · seeded outlier' : ''}</small></div>
                  <StatusPill status={status} label={status === 'offline' ? 'missing' : status} />
                </div>
              )
            })}
          </div>
        </NexusPanel>
      </div>

      <NexusPanel className="p-4">
        <button className="raw-data-toggle" onClick={() => setShowRaw(value => !value)} aria-expanded={showRaw}>Raw dataset and provenance <span>{showRaw ? 'Hide' : 'Show'}</span></button>
        {showRaw && (
          <div className="raw-table-wrap">
            <table className="raw-data-table">
              <thead><tr><th>Sample</th><th>Timestamp</th><th>Origin</th><th>Quality</th><th>Missing</th><th>Outliers</th><th>Stage</th></tr></thead>
              <tbody>{history.map((reading, index) => <tr key={reading.id}><td>{index + 1}</td><td>{new Date(reading.timestamp).toISOString()}</td><td>{reading.dataOrigin.replace('_', ' ')}</td><td>{Math.round(reading.dataQuality * 100)}%</td><td>{reading.missingMetrics.join(', ') || 'None'}</td><td>{reading.outlierMetrics.join(', ') || 'None'}</td><td>{reading.scenarioStage}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>Latest timestamp: {new Date(latest.timestamp).toLocaleString()}</span>
          <span>Data quality: {Math.round(latest.dataQuality * 100)}%</span>
          <MethodDetails methodKey="dataQuality" timestamp={latest.timestamp} compact />
        </div>
      </NexusPanel>

      <PageLimitation>Expected ranges are prototype operating references; they are not certified spacecraft limits.</PageLimitation>
    </div>
  )
}
