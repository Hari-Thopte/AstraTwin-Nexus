import { create } from 'zustand'
import type {
  AgentAssessment,
  AssetId,
  CommunicationState,
  CoordinatedRecoveryPlan,
  FutureInputs,
  FutureScenarioNexus,
  InformationMode,
  NexusAsset,
  NexusAuditEvent,
  NexusIncident,
  NexusMission,
  NexusSimulationState,
  NexusTelemetryReading,
  RiskAssessmentNexus,
  ScienceOpportunityNexus,
} from '../types/nexus'
import {
  DEFAULT_FUTURE_INPUTS,
  INITIAL_NEXUS_AUDIT,
  INITIAL_NEXUS_MISSION,
  INITIAL_OPPORTUNITIES,
  SCENARIO_STAGES,
  TIMELINE_EVENTS,
  buildMissionReportHtml,
  calculateNexusRisk,
  compareNexusFutures,
  createAssets,
  createAudit,
  createCommunication,
  createCouncil,
  createIncident,
  createRecoveryPlan,
  createTelemetry,
} from '../utils/nexusData'
import { nexusApi } from '../services/nexusApi'
import { MISSION_CONFIG } from '../config/mission'

interface NexusStoreState {
  mission: NexusMission
  assets: NexusAsset[]
  telemetryHistory: Record<AssetId, NexusTelemetryReading[]>
  latestTelemetry: Record<AssetId, NexusTelemetryReading>
  incidents: NexusIncident[]
  council: AgentAssessment[]
  futures: FutureScenarioNexus[]
  futureInputs: FutureInputs
  futureInputsDirty: boolean
  futureRunCount: number
  futureLastRunAt: string | null
  futureResultsChanged: boolean | null
  plan: CoordinatedRecoveryPlan | null
  communication: CommunicationState
  opportunities: ScienceOpportunityNexus[]
  audit: NexusAuditEvent[]
  risk: RiskAssessmentNexus
  simulation: NexusSimulationState
  mode: InformationMode
  selectedAssetId: AssetId
  selectedComponentId: string | null
  selectedCausalNodeId: string
  rewindIndex: number
  backendConnected: boolean
  isHydrating: boolean
  lastAction: string
}

interface NexusStoreActions {
  initializeBackend: () => Promise<void>
  startSimulation: () => void
  pauseSimulation: () => void
  resetSimulation: () => void
  setSimulationSpeed: (speed: NexusSimulationState['speed']) => void
  setSimulationSeed: (seed: number) => void
  injectNightfallRescue: () => void
  injectCommunicationBlackout: () => void
  restoreNormalConditions: () => void
  tickSimulation: () => void
  setMode: (mode: InformationMode) => void
  selectAsset: (assetId: AssetId) => void
  selectComponent: (componentId: string | null) => void
  selectCausalNode: (nodeId: string) => void
  setFutureInput: (key: keyof FutureInputs, value: number) => void
  applyFuturePreset: (preset: string) => void
  runFutureComparison: () => void
  approvePlan: (comment?: string) => void
  rejectPlan: (comment?: string) => void
  requestAlternativePlan: () => void
  decideScienceOpportunity: (id: string, decision: 'investigate' | 'defer') => void
  setRewindIndex: (index: number) => void
  generateReport: () => string
}

type NexusStore = NexusStoreState & NexusStoreActions

const DEFAULT_SIMULATION_SEED = 2401
const initialLatest = createTelemetry(32, 0, INITIAL_NEXUS_MISSION.elapsedSeconds, DEFAULT_SIMULATION_SEED)
const initialHistory: Record<AssetId, NexusTelemetryReading[]> = {
  'astra-1': [],
  nova: [],
  selene: [],
}
for (let tick = 0; tick < 32; tick += 1) {
  const readings = createTelemetry(tick, 0, INITIAL_NEXUS_MISSION.elapsedSeconds - (32 - tick) * 20, DEFAULT_SIMULATION_SEED)
  initialHistory['astra-1'].push(readings['astra-1'])
  initialHistory.nova.push(readings.nova)
  initialHistory.selene.push(readings.selene)
}
const initialRisk = calculateNexusRisk(0, initialLatest['astra-1'])

function appendReadings(
  history: Record<AssetId, NexusTelemetryReading[]>,
  latest: Record<AssetId, NexusTelemetryReading>,
) {
  return {
    'astra-1': [...history['astra-1'].slice(-119), latest['astra-1']],
    nova: [...history.nova.slice(-119), latest.nova],
    selene: [...history.selene.slice(-119), latest.selene],
  }
}

function emergencyInputs(reading: NexusTelemetryReading): FutureInputs {
  const m = reading.metrics
  return {
    roverSpeed: m.speed,
    solarOutput: m.solarOutput,
    terrainResistance: m.wheelResistance,
    communicationDuration: reading.scenarioStage >= 7 ? 60 : 0,
    motorTemperature: m.motorTemperature,
    batteryLevel: m.battery,
    radiation: m.radiation,
    safeZoneDistance: m.safeZoneDistance,
  }
}

function futurePreset(name: string): FutureInputs {
  const base = { ...DEFAULT_FUTURE_INPUTS }
  if (name === 'motor-degradation') return { ...base, motorTemperature: 88, terrainResistance: 76, roverSpeed: 0.2 }
  if (name === 'communication-blackout') return { ...base, communicationDuration: 180 }
  if (name === 'lunar-night') return { ...base, solarOutput: 22, safeZoneDistance: 2.8 }
  if (name === 'solar-reduction') return { ...base, solarOutput: 35, batteryLevel: 52 }
  if (name === 'difficult-terrain') return { ...base, terrainResistance: 91, roverSpeed: 0.11 }
  if (name === 'combined-emergency') return { ...base, solarOutput: 24, terrainResistance: 92, communicationDuration: 180, motorTemperature: 91, batteryLevel: 34, safeZoneDistance: 2.9 }
  return base
}

const baseState: NexusStoreState = {
  mission: INITIAL_NEXUS_MISSION,
  assets: createAssets(0, initialLatest),
  telemetryHistory: initialHistory,
  latestTelemetry: initialLatest,
  incidents: [],
  council: [],
  futures: compareNexusFutures(DEFAULT_FUTURE_INPUTS),
  futureInputs: DEFAULT_FUTURE_INPUTS,
  futureInputsDirty: false,
  futureRunCount: 0,
  futureLastRunAt: null,
  futureResultsChanged: null,
  plan: null,
  communication: createCommunication(0),
  opportunities: INITIAL_OPPORTUNITIES,
  audit: INITIAL_NEXUS_AUDIT,
  risk: initialRisk,
  simulation: { isRunning: false, speed: 1, tick: 32, scenarioTick: 0, scenarioStage: 0, activeScenario: null, seed: DEFAULT_SIMULATION_SEED },
  mode: 'commander',
  selectedAssetId: 'astra-1',
  selectedComponentId: null,
  selectedCausalNodeId: 'loose-soil',
  rewindIndex: 0,
  backendConnected: false,
  isHydrating: true,
  lastAction: 'Digital twins synchronized',
}

function withAudit(events: NexusAuditEvent[], ...newEvents: NexusAuditEvent[]) {
  return [...newEvents, ...events].slice(0, 500)
}

export const useNexusStore = create<NexusStore>((set, get) => ({
  ...baseState,

  initializeBackend: async () => {
    try {
      await nexusApi.get('/api/nexus/snapshot')
      set({ backendConnected: true, isHydrating: false, lastAction: 'Backend mission services connected' })
    } catch {
      set({ backendConnected: false, isHydrating: false, lastAction: 'Offline deterministic mission engine active' })
    }
  },

  startSimulation: () => {
    set(state => ({
      simulation: { ...state.simulation, isRunning: true },
      audit: withAudit(state.audit, createAudit('SIMULATION_STARTED', `Simulation started at ${state.simulation.speed}×.`)),
      lastAction: 'Simulation running',
    }))
    if (get().backendConnected) void nexusApi.post('/api/nexus/simulation/start').catch(() => set({ backendConnected: false }))
  },

  pauseSimulation: () => {
    set(state => ({
      simulation: { ...state.simulation, isRunning: false },
      audit: withAudit(state.audit, createAudit('SIMULATION_PAUSED', 'Simulation paused by the mission controller.')),
      lastAction: 'Simulation paused',
    }))
    if (get().backendConnected) void nexusApi.post('/api/nexus/simulation/pause').catch(() => set({ backendConnected: false }))
  },

  resetSimulation: () => {
    const seed = get().simulation.seed
    const latest = createTelemetry(32, 0, INITIAL_NEXUS_MISSION.elapsedSeconds, seed)
    const history: Record<AssetId, NexusTelemetryReading[]> = { 'astra-1': [], nova: [], selene: [] }
    for (let tick = 0; tick < 32; tick += 1) {
      const readings = createTelemetry(tick, 0, INITIAL_NEXUS_MISSION.elapsedSeconds - (32 - tick) * 20, seed)
      history['astra-1'].push(readings['astra-1'])
      history.nova.push(readings.nova)
      history.selene.push(readings.selene)
    }
    set(state => ({
      ...baseState,
      latestTelemetry: latest,
      telemetryHistory: history,
      assets: createAssets(0, latest),
      simulation: { ...baseState.simulation, seed },
      backendConnected: state.backendConnected,
      isHydrating: false,
      audit: withAudit(state.audit, createAudit('SIMULATION_RESET', 'Mission simulation reset to seeded nominal conditions.')),
      lastAction: 'Simulation reset',
    }))
    if (get().backendConnected) void nexusApi.post('/api/nexus/simulation/reset').catch(() => set({ backendConnected: false }))
  },

  setSimulationSpeed: speed => {
    set(state => ({
      simulation: { ...state.simulation, speed },
      audit: withAudit(state.audit, createAudit('SIMULATION_SPEED_CHANGED', `Simulation speed set to ${speed}×.`)),
      lastAction: `Simulation speed ${speed}×`,
    }))
    if (get().backendConnected) void nexusApi.post(`/api/nexus/simulation/speed/${speed}`).catch(() => set({ backendConnected: false }))
  },

  setSimulationSeed: seedValue => {
    const seed = Math.max(1, Math.min(999_999, Math.trunc(seedValue) || DEFAULT_SIMULATION_SEED))
    const latest = createTelemetry(32, 0, INITIAL_NEXUS_MISSION.elapsedSeconds, seed)
    const history: Record<AssetId, NexusTelemetryReading[]> = { 'astra-1': [], nova: [], selene: [] }
    for (let tick = 0; tick < 32; tick += 1) {
      const readings = createTelemetry(tick, 0, INITIAL_NEXUS_MISSION.elapsedSeconds - (32 - tick) * 20, seed)
      history['astra-1'].push(readings['astra-1'])
      history.nova.push(readings.nova)
      history.selene.push(readings.selene)
    }
    set(state => ({
      mission: { ...INITIAL_NEXUS_MISSION },
      simulation: { ...baseState.simulation, seed },
      latestTelemetry: latest,
      telemetryHistory: history,
      assets: createAssets(0, latest),
      risk: calculateNexusRisk(0, latest['astra-1']),
      incidents: [], council: [], plan: null, communication: createCommunication(0), rewindIndex: 0,
      audit: withAudit(state.audit, createAudit('SIMULATION_SEED_CHANGED', `Seeded telemetry regenerated with seed ${seed}.`)),
      lastAction: `Simulation seed ${seed} loaded`,
    }))
  },

  injectNightfallRescue: () => {
    const state = get()
    const stage = 8
    const latest = createTelemetry(state.simulation.tick + 1, stage, state.mission.elapsedSeconds + 20, state.simulation.seed)
    const risk = calculateNexusRisk(stage, latest['astra-1'])
    const incident = createIncident(latest['astra-1'])
    const plan = createRecoveryPlan()
    set({
      simulation: { ...state.simulation, isRunning: false, activeScenario: 'lunar-nightfall-rescue', scenarioTick: 14, scenarioStage: stage, tick: state.simulation.tick + 1 },
      latestTelemetry: latest,
      telemetryHistory: appendReadings(state.telemetryHistory, latest),
      assets: createAssets(stage, latest),
      incidents: [incident], council: createCouncil(risk), plan,
      communication: createCommunication(stage),
      risk,
      futures: compareNexusFutures(emergencyInputs(latest['astra-1'])),
      audit: withAudit(state.audit, createAudit('SCENARIO_INJECTED', `${MISSION_CONFIG.incident.name} loaded as a fixed scenario snapshot.`, 'warning')),
      mission: { ...state.mission, phase: MISSION_CONFIG.missionPhases[4], successProbability: 61, latestRecommendation: plan.name },
      lastAction: `${MISSION_CONFIG.incident.name} snapshot loaded`,
      rewindIndex: stage,
    })
    if (state.backendConnected) void nexusApi.post('/api/nexus/simulation/inject/lunar-nightfall-rescue').catch(() => set({ backendConnected: false }))
  },

  injectCommunicationBlackout: () => {
    const state = get()
    const latest = createTelemetry(state.simulation.tick + 1, 7, state.mission.elapsedSeconds + 20, state.simulation.seed)
    const risk = calculateNexusRisk(7, latest['astra-1'])
    const incident = createIncident(latest['astra-1'])
    const plan = createRecoveryPlan()
    set({
      simulation: { ...state.simulation, isRunning: false, activeScenario: 'communication-blackout', scenarioStage: 7, tick: state.simulation.tick + 1 },
      latestTelemetry: latest, telemetryHistory: appendReadings(state.telemetryHistory, latest), assets: createAssets(7, latest),
      incidents: [incident], council: createCouncil(risk), plan, futures: compareNexusFutures(emergencyInputs(latest['astra-1'])),
      communication: createCommunication(7), risk,
      mission: { ...state.mission, phase: MISSION_CONFIG.missionPhases[4], successProbability: 61, latestRecommendation: plan.name },
      audit: withAudit(state.audit, createAudit('BLACKOUT_INJECTED', 'Earth communication became unavailable; autonomy envelope activated.', 'critical')),
      lastAction: 'Communication blackout active', rewindIndex: 7,
    })
    if (state.backendConnected) void nexusApi.post('/api/nexus/simulation/inject/communication-blackout').catch(() => set({ backendConnected: false }))
  },

  restoreNormalConditions: () => {
    const state = get()
    const latest = createTelemetry(state.simulation.tick + 1, 0, state.mission.elapsedSeconds + 20, state.simulation.seed)
    set({
      simulation: { ...state.simulation, activeScenario: null, scenarioTick: 0, scenarioStage: 0, tick: state.simulation.tick + 1 },
      latestTelemetry: latest, telemetryHistory: appendReadings(state.telemetryHistory, latest), assets: createAssets(0, latest),
      incidents: [], council: [], plan: null, communication: createCommunication(0), risk: calculateNexusRisk(0, latest['astra-1']),
      mission: { ...state.mission, phase: MISSION_CONFIG.activePhase, overallHealth: 96, successProbability: 92, latestRecommendation: 'Normal conditions restored. Continue the terrain survey.' },
      audit: withAudit(state.audit, createAudit('NORMAL_CONDITIONS_RESTORED', 'All simulated conditions returned to nominal.')),
      lastAction: 'Normal conditions restored', rewindIndex: 0,
    })
    if (state.backendConnected) void nexusApi.post('/api/nexus/simulation/restore').catch(() => set({ backendConnected: false }))
  },

  tickSimulation: () => {
    const state = get()
    if (!state.simulation.isRunning) return
    const tick = state.simulation.tick + state.simulation.speed
    const scenarioTick = state.simulation.scenarioTick + state.simulation.speed
    let stage = state.simulation.scenarioStage
    if (state.simulation.activeScenario === 'lunar-nightfall-rescue') stage = Math.min(8, 1 + Math.floor(scenarioTick / 2))
    if (state.simulation.activeScenario === 'communication-blackout') stage = Math.max(7, stage)
    const elapsed = state.mission.elapsedSeconds + state.simulation.speed * 20
    const latest = createTelemetry(tick, stage, elapsed, state.simulation.seed)
    const risk = calculateNexusRisk(stage, latest['astra-1'])
    const stageChanged = stage !== state.simulation.scenarioStage
    const incident = stage >= 6 ? (state.incidents[0] ?? createIncident(latest['astra-1'])) : undefined
    const plan = stage >= 6 ? (state.plan ?? createRecoveryPlan()) : state.plan
    const council = stage >= 6 ? (state.council.length ? state.council : createCouncil(risk)) : state.council
    const inputs = stage >= 6 ? emergencyInputs(latest['astra-1']) : state.futureInputs
    const futures = stage >= 6 ? compareNexusFutures(inputs) : state.futures
    const assets = createAssets(stage, latest)
    const overallHealth = clampNumber(assets.reduce((sum, asset) => sum + asset.health, 0) / assets.length)
    const events: NexusAuditEvent[] = []
    if (stageChanged) {
      events.push(createAudit('SCENARIO_STAGE_ADVANCED', SCENARIO_STAGES[stage], stage >= 6 ? 'critical' : 'warning', 'SIMULATION_ENGINE'))
      if (stage === 6) {
        events.push(createAudit('CORRELATED_INCIDENT_DETECTED', 'Cross-sensor rules and Isolation Forest confirmed terrain-driven mobility stress.', 'critical', 'ANOMALY_ENGINE'))
        events.push(createAudit('MISSION_COUNCIL_CONVENED', 'Six-agent council generated a safety-validated rescue recommendation.', 'warning', 'MISSION_DIRECTOR'))
        events.push(createAudit('RECOVERY_PLAN_GENERATED', 'A* high-sunlight rescue route and multi-asset plan generated.', 'warning', 'NAVIGATOR'))
      }
      if (stage === 7) events.push(createAudit('EARTH_LINK_LOST', `${MISSION_CONFIG.assets.relay.name} local relay remains available; autonomy envelope active.`, 'critical', 'COMMUNICATION_ENGINE'))
    }
    set({
      simulation: { ...state.simulation, tick, scenarioTick, scenarioStage: stage },
      latestTelemetry: latest,
      telemetryHistory: appendReadings(state.telemetryHistory, latest),
      assets,
      incidents: incident ? [{ ...incident, status: plan?.status === 'approved' ? 'approved' : 'awaiting_approval' }] : [],
      council,
      plan,
      futureInputs: inputs,
      futures,
      risk,
      communication: {
        ...createCommunication(stage),
        blackoutRemainingSeconds: stage >= 7
          ? state.communication.earthConnected
            ? 3600
            : Math.max(0, state.communication.blackoutRemainingSeconds - state.simulation.speed * 20)
          : 0,
      },
      mission: {
        ...state.mission,
        elapsedSeconds: elapsed,
        overallHealth,
        successProbability: plan?.status === 'approved' ? 87 : clampNumber(92 - risk.score * 0.43, 42, 92),
        latestRecommendation: plan ? plan.name : stage >= 2 ? 'Increase traction monitoring frequency.' : 'Continue coordinated ice-rich terrain survey.',
      },
      opportunities: state.opportunities.map(item => item.id === 'science-ice-signature' && stage >= 5 ? { ...item, missionRisk: 67, recommendation: `Protect the coordinates and defer sampling until ${MISSION_CONFIG.assets.primary.name} reaches the sunlight-safe zone.` } : item),
      audit: withAudit(state.audit, ...events),
      lastAction: stageChanged ? SCENARIO_STAGES[stage] : 'Telemetry synchronized',
      rewindIndex: stage,
    })
    if (state.backendConnected) void nexusApi.post('/api/nexus/simulation/tick').catch(() => set({ backendConnected: false }))
  },

  setMode: mode => set(state => ({ mode, audit: withAudit(state.audit, createAudit('EXPLANATION_MODE_CHANGED', `Information mode changed to ${mode}.`)), lastAction: `${mode} mode active` })),
  selectAsset: selectedAssetId => set({ selectedAssetId, selectedComponentId: null }),
  selectComponent: selectedComponentId => set({ selectedComponentId }),
  selectCausalNode: selectedCausalNodeId => set({ selectedCausalNodeId }),

  setFutureInput: (key, value) => set(state => ({
    futureInputs: { ...state.futureInputs, [key]: value },
    futureInputsDirty: true,
    lastAction: 'Future inputs changed — simulation ready to run',
  })),
  applyFuturePreset: preset => set({
    futureInputs: futurePreset(preset),
    futureInputsDirty: true,
    lastAction: `${preset.replace(/-/g, ' ')} preset loaded — simulation ready to run`,
  }),
  runFutureComparison: () => {
    const state = get()
    const futures = compareNexusFutures(state.futureInputs)
    const resultsChanged = JSON.stringify(futures) !== JSON.stringify(state.futures)
    const runCount = state.futureRunCount + 1
    set({
      futures,
      futureInputsDirty: false,
      futureRunCount: runCount,
      futureLastRunAt: new Date().toISOString(),
      futureResultsChanged: resultsChanged,
      audit: withAudit(state.audit, createAudit('FUTURES_COMPARED', `Deterministic future comparison run ${runCount} completed${resultsChanged ? ' with updated outputs' : '; identical inputs produced unchanged outputs'}.`)),
      lastAction: resultsChanged ? `Future comparison run ${runCount} updated` : `Future comparison run ${runCount} complete — deterministic results unchanged`,
    })
    if (state.backendConnected) {
      const i = state.futureInputs
      void nexusApi.post('/api/nexus/futures/compare', {
        rover_speed: i.roverSpeed, solar_output: i.solarOutput, terrain_resistance: i.terrainResistance,
        communication_duration: i.communicationDuration, motor_temperature: i.motorTemperature,
        battery_level: i.batteryLevel, radiation: i.radiation, safe_zone_distance: i.safeZoneDistance,
      }).catch(() => set({ backendConnected: false }))
    }
  },

  approvePlan: (comment = 'Validated rescue plan approved by human operator.') => {
    const state = get()
    if (!state.plan) return
    const plan = { ...state.plan, status: 'approved' as const, missionSuccessProbability: 87, actions: state.plan.actions.map(action => ({ ...action, completed: action.order <= 5 })) }
    set({
      plan,
      incidents: state.incidents.map(incident => ({ ...incident, status: 'approved' as const })),
      mission: { ...state.mission, successProbability: 87, latestRecommendation: 'Approved: execute the coordinated rescue inside the autonomy envelope.' },
      audit: withAudit(state.audit, createAudit('RECOMMENDATION_APPROVED', comment, 'warning')),
      lastAction: 'Recovery plan approved — no real command transmitted',
    })
    if (state.backendConnected) void nexusApi.post(`/api/nexus/plans/${state.plan.id}/decision`, { decision: 'approved', operator: 'MISSION_CONTROLLER', comment }).catch(() => set({ backendConnected: false }))
  },

  rejectPlan: (comment = 'Recommendation rejected by human operator.') => {
    const state = get()
    if (!state.plan) return
    set({
      plan: { ...state.plan, status: 'rejected' },
      incidents: state.incidents.map(incident => ({ ...incident, status: 'rejected' as const })),
      audit: withAudit(state.audit, createAudit('RECOMMENDATION_REJECTED', comment, 'warning')),
      lastAction: 'Recovery plan rejected',
    })
    if (state.backendConnected) void nexusApi.post(`/api/nexus/plans/${state.plan.id}/decision`, { decision: 'rejected', operator: 'MISSION_CONTROLLER', comment }).catch(() => set({ backendConnected: false }))
  },

  requestAlternativePlan: () => {
    const state = get()
    if (!state.plan) return
    const alternative: CoordinatedRecoveryPlan = {
      ...state.plan,
      id: 'plan-nightfall-rescue-conservative',
      name: 'Conservative Relay-Assisted Rescue',
      estimatedEnergyWh: state.plan.estimatedEnergyWh - 42,
      estimatedDurationMinutes: state.plan.estimatedDurationMinutes + 24,
      safetyScore: Math.min(100, state.plan.safetyScore + 4),
      missionSuccessProbability: 89,
      tradeoffs: [...state.plan.tradeoffs, 'Longer stop-and-scan cadence'],
      status: 'awaiting_approval',
    }
    set({ plan: alternative, audit: withAudit(state.audit, createAudit('ALTERNATIVE_PLAN_REQUESTED', 'Mission Council produced a more conservative relay-assisted alternative.', 'warning')), lastAction: 'Alternative plan generated' })
    if (state.backendConnected) void nexusApi.post(`/api/nexus/plans/${state.plan.id}/decision`, { decision: 'alternative_requested', operator: 'MISSION_CONTROLLER', comment: 'Generate a more conservative route.' }).catch(() => set({ backendConnected: false }))
  },

  decideScienceOpportunity: (id, decision) => {
    const state = get()
    const opportunity = state.opportunities.find(item => item.id === id)
    if (!opportunity) return
    set({
      opportunities: state.opportunities.map(item => item.id === id ? { ...item, decision } : item),
      audit: withAudit(state.audit, createAudit(`SCIENCE_${decision.toUpperCase()}`, `${opportunity.title}: ${decision}.`)),
      lastAction: `Science opportunity ${decision}`,
    })
    if (state.backendConnected) void nexusApi.post(`/api/nexus/science/${id}/decision`, { decision, operator: 'MISSION_CONTROLLER' }).catch(() => set({ backendConnected: false }))
  },

  setRewindIndex: rewindIndex => set({ rewindIndex: Math.max(0, Math.min(TIMELINE_EVENTS.length - 1, rewindIndex)), lastAction: `Mission rewind: ${TIMELINE_EVENTS[rewindIndex]?.label ?? 'timeline'}` }),

  generateReport: () => {
    const state = get()
    const html = buildMissionReportHtml({ mission: state.mission, assets: state.assets, incident: state.incidents[0], council: state.council, futures: state.futures, plan: state.plan ?? undefined, audit: state.audit })
    set({ audit: withAudit(state.audit, createAudit('MISSION_REPORT_GENERATED', 'Downloadable mission intelligence report generated.')), lastAction: 'Mission report generated' })
    if (state.backendConnected) void nexusApi.post('/api/nexus/reports/generate').catch(() => set({ backendConnected: false }))
    return html
  },
}))

function clampNumber(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, value)) * 10) / 10
}
