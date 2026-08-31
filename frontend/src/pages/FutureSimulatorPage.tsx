import { AlertTriangle, BatteryCharging, CheckCircle2, Clock3, Gauge, GitCompareArrows, Radio, Route, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { MethodDetails, MiniBar, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'
import type { FutureInputs } from '../types/nexus'

const INPUTS: Array<{ key: keyof FutureInputs; label: string; min: number; max: number; step: number; unit: string }> = [
  { key: 'roverSpeed', label: 'Rover speed', min: 0.04, max: 0.35, step: 0.01, unit: 'm/s' },
  { key: 'solarOutput', label: 'Solar output', min: 0, max: 220, step: 1, unit: 'W' },
  { key: 'terrainResistance', label: 'Terrain resistance', min: 0, max: 100, step: 1, unit: '/100' },
  { key: 'communicationDuration', label: 'Blackout duration', min: 0, max: 240, step: 5, unit: 'min' },
  { key: 'motorTemperature', label: 'Motor temperature', min: -20, max: 110, step: 1, unit: '°C' },
  { key: 'batteryLevel', label: 'Battery level', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'radiation', label: 'Radiation', min: 0, max: 5, step: 0.01, unit: 'mSv/h' },
  { key: 'safeZoneDistance', label: 'Distance to safe zone', min: 0.1, max: 10, step: 0.1, unit: 'km' },
]

const PRESETS = [
  ['motor-degradation', 'Motor degradation'], ['communication-blackout', 'Communication blackout'],
  ['lunar-night', 'Lunar night approaching'], ['solar-reduction', 'Solar-power reduction'],
  ['difficult-terrain', 'Difficult terrain'], ['combined-emergency', 'Combined emergency'],
]

export function FutureSimulatorPage() {
  const inputs = useNexusStore(state => state.futureInputs)
  const futures = useNexusStore(state => state.futures)
  const inputsDirty = useNexusStore(state => state.futureInputsDirty)
  const runCount = useNexusStore(state => state.futureRunCount)
  const lastRunAt = useNexusStore(state => state.futureLastRunAt)
  const resultsChanged = useNexusStore(state => state.futureResultsChanged)
  const plan = useNexusStore(state => state.plan)
  const setInput = useNexusStore(state => state.setFutureInput)
  const applyPreset = useNexusStore(state => state.applyFuturePreset)
  const run = useNexusStore(state => state.runFutureComparison)

  return (
    <div className="nexus-page space-y-5">
      <PageHeading
        title="Future Comparison"
        description="Adjust scenario inputs and compare three deterministic outcome branches against the current fixed mission state."
        actions={<button type="button" className="nexus-btn-primary" onClick={run}><GitCompareArrows size={14} /> Recalculate futures</button>}
      />
      <NexusPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="nexus-section-title">Current scenario state</div><p className="mt-1 text-xs text-slate-400">Battery {inputs.batteryLevel}% · motor {inputs.motorTemperature}°C · solar {inputs.solarOutput} W · safe zone {inputs.safeZoneDistance} km</p></div><SourceLabel>Scenario inputs</SourceLabel></div>
        <MethodDetails methodKey="futureSimulation" inputs={Object.entries(inputs).map(([key, value]) => `${key}: ${value}`)} />
      </NexusPanel>

      <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="space-y-4">
          <NexusPanel className="p-4">
            <div className="nexus-section-title">Mission condition inputs</div>
            <div className="mt-4 space-y-4">
              {INPUTS.map(item => (
                <label key={item.key} className="block">
                  <div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-slate-400">{item.label}</span><span className="font-mono text-cyan-300">{inputs[item.key]} {item.unit}</span></div>
                  <input type="range" min={item.min} max={item.max} step={item.step} value={inputs[item.key]} onChange={event => setInput(item.key, Number(event.target.value))} className="nexus-range" />
                </label>
              ))}
            </div>
            <button type="button" className="nexus-btn-primary mt-5 w-full justify-center" onClick={run}><Sparkles size={14} /> Run deterministic simulation</button>
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-4 ${inputsDirty ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-200' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}
              role="status"
              aria-live="polite"
              data-testid="future-run-status"
            >
              {inputsDirty ? <Sparkles size={13} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={13} className="mt-0.5 shrink-0" />}
              <span>
                {inputsDirty
                  ? 'Inputs changed. Run the deterministic simulation to update all three branches.'
                  : runCount > 0
                    ? `Run ${runCount} completed${lastRunAt ? ` at ${new Date(lastRunAt).toLocaleTimeString()}` : ''}. ${resultsChanged ? 'Outcome cards were updated.' : 'Outputs are unchanged because the inputs and formulas are deterministic.'}`
                    : 'The displayed branches are the initial deterministic baseline. Run the simulation after changing any input.'}
              </span>
            </div>
          </NexusPanel>
          <NexusPanel className="p-4">
            <div className="nexus-section-title">Scenario presets</div>
            <div className="mt-3 grid grid-cols-2 gap-2">{PRESETS.map(([id, label]) => <button type="button" key={id} className="preset-button" onClick={() => applyPreset(id)}>{label}</button>)}</div>
          </NexusPanel>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {futures.map((future, index) => {
              const accent = future.recommended ? '#21d99a' : index === 0 ? '#ff7a33' : '#f5b942'
              return (
                <NexusPanel key={future.id} className="relative overflow-hidden p-4" accent={accent}>
                  {future.recommended && <div className="absolute right-0 top-0 rounded-bl-lg bg-emerald-400 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-950">Recommended</div>}
                  <div className="nexus-eyebrow">Future branch {index + 1}</div>
                  <h2 className="mt-2 min-h-12 pr-12 text-base font-semibold text-slate-100">{future.name}</h2>
                  <div className="mt-4 rounded-xl bg-white/[0.025] p-3 text-center"><div className="text-[10px] uppercase text-slate-500">Simulated outcome score</div><div className="mt-1 font-mono text-4xl" style={{ color: accent }}>{future.missionSuccessProbability.toFixed(0)}<span className="text-xs text-slate-500"> /100</span></div><MiniBar value={future.missionSuccessProbability} color={accent} /><SourceLabel>Calculated simulation</SourceLabel></div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <FutureMetric icon={<BatteryCharging size={11} />} label="Battery" value={`${future.remainingBattery.toFixed(0)}%`} />
                    <FutureMetric icon={<AlertTriangle size={11} />} label="Failure risk" value={`${future.componentFailureRisk.toFixed(0)}%`} />
                    <FutureMetric icon={<Clock3 size={11} />} label="Travel time" value={`${future.travelTimeMinutes}m`} />
                    <FutureMetric icon={<Target size={11} />} label="Science" value={`${future.scientificValuePreserved.toFixed(0)}%`} />
                    <FutureMetric icon={<Radio size={11} />} label="Comms" value={`${future.communicationAvailability.toFixed(0)}%`} />
                    <FutureMetric icon={<ShieldCheck size={11} />} label="Safety" value={`${future.safetyScore.toFixed(0)}/100`} />
                  </div>
                  <div className="mt-4 border-t border-white/[0.06] pt-3"><div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Main risks</div>{future.mainRisks.map(risk => <div key={risk} className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-4 text-slate-400"><AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: accent }} />{risk}</div>)}</div>
                  <div className="mt-3 rounded-lg bg-white/[0.02] p-2 text-[10px] leading-4 text-slate-400"><strong className="text-slate-300">Difference from baseline:</strong> {index === 0 ? 'Baseline branch' : `${future.missionSuccessProbability - futures[0].missionSuccessProbability >= 0 ? '+' : ''}${(future.missionSuccessProbability - futures[0].missionSuccessProbability).toFixed(1)} outcome-score points`}</div>
                  <div className="mt-2 text-[10px] leading-4 text-slate-500"><strong>Assumption:</strong> all branches use the same input state and deterministic weights. No uncertainty distribution is calculated.</div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>Scenario confidence</span><span className="font-mono text-slate-300">{Math.round(future.confidence * 100)}% · scenario value</span></div>
                  <MethodDetails methodKey="futureSimulation" compact />
                </NexusPanel>
              )
            })}
          </div>

          <NexusPanel className="p-4" accent="#22d3ee">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2"><Route size={15} className="text-cyan-300" /><div className="nexus-section-title">Route evaluation</div></div>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">The backend implements A* on a 12 × 8 cost grid. Values below are the fixed frontend route fixture unless a backend plan has been loaded.</p>
              </div>
              <StatusPill status={plan?.safetyValidated ? 'normal' : 'warning'} label={plan?.safetyValidated ? 'constraints passed' : 'preview route'} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {Object.entries(plan?.route.scoringFactors ?? { terrain: 24, sunlight: 72, communication: 83, componentStress: 29 }).map(([label, value]) => <div key={label} className="incident-stat"><span>{label.replace(/([A-Z])/g, ' $1')}</span><strong>{value.toFixed(0)}</strong></div>)}
              <div className="incident-stat"><span>Distance</span><strong>{plan?.route.distanceKm ?? 2.52} km</strong></div>
              <div className="incident-stat"><span>Energy</span><strong>{plan?.route.estimatedEnergyWh ?? 438} Wh</strong></div>
              <div className="incident-stat"><span>Safety</span><strong>{plan?.route.safetyScore ?? 82}/100</strong></div>
            </div>
            <MethodDetails methodKey="routePlanning" />
          </NexusPanel>

          <NexusPanel className="p-4">
            <div className="flex items-center gap-2"><Gauge size={15} className="text-purple-300" /><div className="nexus-section-title">Interpretation</div></div>
            <p className="mt-2 text-xs leading-5 text-slate-400">The recommended branch has the highest deterministic safety-weighted outcome for these inputs. It is a sensitivity comparison, not a calibrated forecast.</p>
          </NexusPanel>
        </div>
      </div>
      <PageLimitation>Branch outputs are deterministic sensitivity estimates and must not be interpreted as calibrated mission probabilities.</PageLimitation>
    </div>
  )
}

function FutureMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg bg-white/[0.025] p-2"><div className="flex items-center gap-1 text-[9px] text-slate-500">{icon}{label}</div><div className="mt-1 font-mono text-sm text-slate-200">{value}</div></div>
}
