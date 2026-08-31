import type {
  AgentAssessment,
  AssetId,
  CommunicationState,
  CoordinatedRecoveryPlan,
  FutureInputs,
  FutureScenarioNexus,
  MemoryLink,
  MemoryNode,
  NexusAsset,
  NexusAuditEvent,
  NexusIncident,
  NexusMission,
  NexusStatus,
  NexusTelemetryReading,
  RescueRoute,
  RiskAssessmentNexus,
  ScienceOpportunityNexus,
  TimelineEvent,
} from '../types/nexus'
import { MISSION_CONFIG } from '../config/mission'

export const NEXUS_STATUS_COLORS: Record<NexusStatus, string> = {
  normal: '#21d99a',
  warning: '#f5b942',
  high: '#ff7a33',
  critical: '#ff405f',
  offline: '#64748b',
}

export const INITIAL_NEXUS_MISSION: NexusMission = {
  id: MISSION_CONFIG.id,
  name: MISSION_CONFIG.name,
  phase: MISSION_CONFIG.activePhase,
  elapsedSeconds: 1_913_760,
  overallHealth: 96,
  successProbability: 92,
  objectivesCompleted: 4,
  totalObjectives: 7,
  latestRecommendation: 'Continue coordinated ice-rich terrain survey.',
}

export const SCENARIO_STAGES = [
  'Normal coordinated survey',
  `${MISSION_CONFIG.assets.primary.name} approaches loose regolith`,
  'Left-wheel resistance increases',
  'Motor vibration rises',
  'Motor temperature increases',
  'Battery drain accelerates and sunlight declines',
  'Correlated incident confirmed',
  'Earth communication blackout',
  'Mission Council plan awaiting approval',
]

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 'timeline-normal', stage: 0, label: 'Normal operation', detail: 'Three assets conduct a coordinated ice-rich terrain survey.', kind: 'verified_observation' },
  { id: 'timeline-soil', stage: 1, label: 'Loose-soil scenario event', detail: `The manual scenario places ${MISSION_CONFIG.assets.primary.name} in softer regolith.`, kind: 'verified_observation' },
  { id: 'timeline-resistance', stage: 2, label: 'First abnormal signal', detail: 'Left-wheel resistance rises above the 42 N expected range.', kind: 'detected_anomaly' },
  { id: 'timeline-vibration', stage: 3, label: 'Anomaly develops', detail: 'Motor vibration and current begin rising together.', kind: 'detected_anomaly' },
  { id: 'timeline-thermal', stage: 4, label: 'Thermal propagation', detail: 'Drive motor temperature trends upward under sustained load.', kind: 'inferred_cause' },
  { id: 'timeline-confirmed', stage: 5, label: 'Anomaly confirmed', detail: 'Accelerated battery drain and falling solar input match the cross-sensor rule.', kind: 'detected_anomaly' },
  { id: 'timeline-root', stage: 6, label: 'Cause inferred', detail: 'Cross-sensor and backend Isolation Forest evidence support a terrain-stress inference.', kind: 'inferred_cause' },
  { id: 'timeline-blackout', stage: 7, label: 'Earth link unavailable', detail: `The autonomy envelope activates while ${MISSION_CONFIG.assets.relay.name} maintains a local relay.`, kind: 'predicted_outcome' },
  { id: 'timeline-council', stage: 8, label: 'Council recommendation', detail: 'Six agents compare futures and request approval for the rescue route.', kind: 'recommended_action' },
]

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, value)) * 10) / 10
}

function signal(tick: number, offset: number, amplitude: number) {
  return Math.sin((tick + offset) * 0.73) * amplitude
}

function seededNoise(seed: number, tick: number, channel: number, amplitude: number) {
  const value = Math.sin(seed * 12.9898 + tick * 78.233 + channel * 37.719) * 43_758.5453
  return ((value - Math.floor(value)) * 2 - 1) * amplitude
}

function seededEvent(seed: number, tick: number, channel: number, interval: number) {
  return Math.abs((seed * 31 + tick * 17 + channel * 13) % interval) === 0
}

export function createTelemetry(
  tick: number,
  stage: number,
  elapsed: number,
  seed = 2401,
): Record<AssetId, NexusTelemetryReading> {
  const pressure = Math.max(0, stage - 1)
  const timestampBase = Date.UTC(2026, 7, 30, 5, 0, 0) + seed * 1000 + tick * 20_000
  const astraMetrics: Record<string, number> = {
    battery: clamp(88 - tick * 0.14 - pressure * 5.1, 12, 100),
    batteryVoltage: clamp(28.5 - pressure * 0.32 + signal(tick, 1, 0.07) + seededNoise(seed, tick, 1, 0.025), 21, 30),
    batteryDischargeRate: clamp(0.72 + pressure * 0.24 + signal(tick, 2, 0.04) + seededNoise(seed, tick, 2, 0.018), 0.2, 3.4),
    solarOutput: clamp(172 - pressure * 18.2 + signal(tick, 3, 2.8) + seededNoise(seed, tick, 3, 1.2), 10, 220),
    motorTemperature: clamp(38 + pressure * 6.5 + signal(tick, 4, 0.9) + seededNoise(seed, tick, 4, 0.28), -20, 115),
    wheelVibration: clamp(1.45 + pressure * 0.91 + signal(tick, 5, 0.12) + seededNoise(seed, tick, 5, 0.055), 0, 14),
    wheelResistance: clamp(25 + pressure * 9.8 + signal(tick, 6, 1.1) + seededNoise(seed, tick, 6, 0.45), 8, 115),
    motorCurrent: clamp(5.8 + pressure * 1.34 + signal(tick, 7, 0.15) + seededNoise(seed, tick, 7, 0.07), 2, 22),
    speed: clamp(0.22 - pressure * 0.012, 0.07, 0.32),
    terrainSlope: clamp(6.2 + pressure * 1.22 + signal(tick, 8, 0.3), 0, 30),
    radiation: clamp(0.24 + signal(tick, 9, 0.025) + seededNoise(seed, tick, 9, 0.008), 0.04, 5),
    communicationStrength: clamp(-52 - pressure * 4.8, -120, -25),
    remainingOperatingMinutes: clamp(310 - pressure * 35, 26, 360),
    safeZoneDistance: clamp(2.1 - tick * 0.008, 0.2, 3),
  }
  const novaMetrics: Record<string, number> = {
    battery: clamp(84 - tick * 0.08 - (stage >= 5 ? 3 : 0), 22, 100),
    altitude: clamp(34 + signal(tick, 2, 2.2) + seededNoise(seed, tick, 12, 0.7), 12, 62),
    flightStability: clamp(97 - pressure * 0.65 + signal(tick, 3, 0.45), 72, 100),
    cameraCondition: 96,
    signalStrength: clamp(-47 - (stage >= 7 ? 8 : 0), -100, -25),
    distanceFromRover: clamp(0.82 - (stage >= 5 ? 0.18 : 0), 0.2, 2.2),
    terrainScanCoverage: clamp(42 + pressure * 7.5, 0, 100),
  }
  const seleneMetrics: Record<string, number> = {
    availableEnergy: clamp(94 - tick * 0.025, 65, 100),
    relaySignalStrength: clamp(-43 - (stage >= 7 ? 5 : 0), -95, -25),
    dataStorageCapacity: clamp(68 - pressure * 1.35, 30, 100),
    thermalCondition: clamp(21 + signal(tick, 1, 0.7) + seededNoise(seed, tick, 21, 0.18), -10, 50),
    communicationAvailability: stage >= 7 ? 0 : 100,
    relayReadiness: 98,
  }
  const astraOutliers = seededEvent(seed, tick, 2, 29) ? ['wheelVibration'] : []
  if (astraOutliers.length) astraMetrics.wheelVibration = clamp(astraMetrics.wheelVibration + 0.78, 0, 14)
  const missingByAsset: Record<AssetId, string[]> = {
    'astra-1': seededEvent(seed, tick, 4, 23) ? ['radiation'] : [],
    nova: seededEvent(seed, tick, 7, 31) ? ['cameraCondition'] : [],
    selene: seededEvent(seed, tick, 9, 37) ? ['thermalCondition'] : [],
  }
  const outliersByAsset: Record<AssetId, string[]> = { 'astra-1': astraOutliers, nova: [], selene: [] }
  const reading = (assetId: AssetId, metrics: Record<string, number>, baseQuality: number, offsetMs: number): NexusTelemetryReading => {
    const missing = missingByAsset[assetId]
    const outliers = outliersByAsset[assetId]
    return ({
    id: `${assetId}-${tick}-${stage}`,
    assetId,
    timestamp: new Date(timestampBase + offsetMs).toISOString(),
    missionElapsedTime: elapsed,
    scenarioStage: stage,
    metrics,
    dataQuality: clamp((baseQuality - missing.length * 0.08 - outliers.length * 0.035) * 100) / 100,
    observed: true,
    seed,
    dataOrigin: 'seeded_simulation',
    missingMetrics: missing,
    outlierMetrics: outliers,
  })}
  return {
    'astra-1': reading('astra-1', astraMetrics, stage >= 7 ? 0.84 : 0.98, 0),
    nova: reading('nova', novaMetrics, 0.96, -3_400),
    selene: reading('selene', seleneMetrics, 0.99, -6_800),
  }
}

function healthStatus(health: number): NexusStatus {
  if (health < 35) return 'critical'
  if (health < 55) return 'high'
  if (health < 78) return 'warning'
  return 'normal'
}

export function createAssets(stage: number, readings: Record<AssetId, NexusTelemetryReading>): NexusAsset[] {
  const astra = readings['astra-1'].metrics
  const wheelHealth = clamp(100 - Math.max(0, astra.wheelResistance - 42) * 0.62 - Math.max(0, astra.wheelVibration - 3.2) * 4.1, 8, 100)
  const motorHealth = clamp(100 - Math.max(0, astra.motorTemperature - 52) * 0.88 - Math.max(0, astra.wheelVibration - 3.2) * 2.1, 8, 100)
  const batteryHealth = clamp(98 - Math.max(0, 55 - astra.battery) * 0.68 - Math.max(0, 105 - astra.solarOutput) * 0.17, 8, 100)
  const solarHealth = clamp(99 - Math.max(0, 105 - astra.solarOutput) * 0.18, 10, 100)
  const antennaHealth = stage >= 7 ? 62 : 97
  const components = [
    { id: 'left-wheel', name: 'Left Wheel Assembly', health: wheelHealth, status: healthStatus(wheelHealth), evidence: `Resistance ${astra.wheelResistance.toFixed(1)} N` },
    { id: 'drive-motor', name: 'Drive Motor', health: motorHealth, status: healthStatus(motorHealth), evidence: `Temperature ${astra.motorTemperature.toFixed(1)} °C` },
    { id: 'primary-battery', name: 'Primary Battery', health: batteryHealth, status: healthStatus(batteryHealth), evidence: `Charge ${astra.battery.toFixed(1)}%` },
    { id: 'solar-array', name: 'Solar Array', health: solarHealth, status: healthStatus(solarHealth), evidence: `Output ${astra.solarOutput.toFixed(1)} W` },
    { id: 'high-gain-antenna', name: 'High-Gain Antenna', health: antennaHealth, status: healthStatus(antennaHealth), evidence: stage >= 7 ? 'Earth link unavailable' : 'Earth link stable' },
    { id: 'science-payload', name: 'Science Payload', health: 93, status: 'normal' as NexusStatus, evidence: 'Priority data synchronized' },
  ]
  return [
    {
      id: 'astra-1', name: MISSION_CONFIG.assets.primary.name, kind: 'rover',
      health: clamp(components.reduce((sum, item) => sum + item.health, 0) / components.length),
      energy: astra.battery, communicationStrength: astra.communicationStrength,
      activity: stage >= 6 ? 'Rescue route awaiting approval' : 'Traversing toward ice-rich terrain',
      coordinates: [-89.542, 124.218], mapPosition: [26, 69],
      status: stage >= 6 ? 'high' : stage >= 4 ? 'warning' : 'normal',
      activeRisks: stage >= 5 ? ['Mobility stress', 'Declining solar energy'] : [], components,
    },
    {
      id: 'nova', name: MISSION_CONFIG.assets.support.name, kind: 'drone', health: 94, energy: readings.nova.metrics.battery,
      communicationStrength: readings.nova.metrics.signalStrength,
      activity: stage >= 5 ? 'Scanning rescue corridor' : 'Surveying terrain ahead',
      coordinates: [-89.536, 124.231], mapPosition: [43, 49],
      status: stage >= 7 ? 'warning' : 'normal', activeRisks: stage >= 7 ? ['Reduced relay margin'] : [],
      components: [
        { id: 'flight-system', name: 'Flight System', health: 95, status: 'normal', evidence: 'Stability within ±2.1°' },
        { id: 'terrain-camera', name: 'Terrain Camera', health: 96, status: 'normal', evidence: 'Scan quality 96%' },
        { id: 'nova-battery', name: 'Flight Battery', health: readings.nova.metrics.battery, status: 'normal', evidence: `${readings.nova.metrics.battery.toFixed(0)}% charge` },
      ],
    },
    {
      id: 'selene', name: MISSION_CONFIG.assets.relay.name, kind: 'base', health: 98, energy: readings.selene.metrics.availableEnergy,
      communicationStrength: readings.selene.metrics.relaySignalStrength,
      activity: stage >= 7 ? 'Local relay active — Earth unavailable' : 'Maintaining Earth and surface relay',
      coordinates: [-89.501, 124.101], mapPosition: [14, 24],
      status: stage >= 7 ? 'warning' : 'normal', activeRisks: stage >= 7 ? ['Earth communication blackout'] : [],
      components: [
        { id: 'relay-array', name: 'Relay Array', health: 96, status: stage >= 7 ? 'warning' : 'normal', evidence: stage >= 7 ? 'Local relay only' : 'Earth relay stable' },
        { id: 'base-power', name: 'Base Power', health: 98, status: 'normal', evidence: '94% energy available' },
        { id: 'data-vault', name: 'Research Data Vault', health: 99, status: 'normal', evidence: '32% capacity used' },
      ],
    },
  ]
}

export const RESCUE_ROUTE: RescueRoute = {
  id: 'route-rescue',
  name: 'High-Sunlight Rescue Route',
  points: [
    [1, 6], [2, 6], [3, 6], [3, 5], [3, 4], [3, 3], [4, 3], [4, 2],
    [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1],
  ].map(([x, y], index) => ({ x, y, sunlight: index > 10 ? 0.92 : 0.56, terrainRisk: index < 3 ? 0.36 : 0.24, communicationCoverage: index === 7 ? 0.42 : 0.86 })),
  distanceKm: 2.52,
  estimatedEnergyWh: 438,
  durationMinutes: 126,
  safetyScore: 82,
  scienceValue: 74,
  overallRisk: 18,
  scoringFactors: { terrain: 24, sunlight: 72, communication: 83, componentStress: 29 },
}

export const ORIGINAL_ROUTE_POINTS: Array<[number, number]> = [[26, 69], [36, 60], [52, 54], [65, 43], [79, 31], [88, 17]]
export const RESCUE_ROUTE_POINTS: Array<[number, number]> = [[26, 69], [31, 61], [39, 56], [46, 47], [58, 39], [71, 28], [86, 18]]

export function calculateNexusRisk(stage: number, reading: NexusTelemetryReading): RiskAssessmentNexus {
  const m = reading.metrics
  const score = clamp(
    stage * 7.5
      + Math.max(0, m.wheelResistance - 38) * 0.34
      + Math.max(0, m.motorTemperature - 55) * 0.48
      + Math.max(0, 60 - m.battery) * 0.25
      + (stage >= 7 ? 12 : 0),
  )
  const level = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low'
  return {
    score,
    level,
    contributingFactors: [
      `Terrain load ${m.wheelResistance.toFixed(0)} N`,
      `Motor temperature ${m.motorTemperature.toFixed(0)} °C`,
      `Battery reserve ${m.battery.toFixed(0)}%`,
      stage >= 7 ? 'Earth link unavailable' : 'Earth link available',
    ],
    confidence: stage >= 6 ? 0.9 : 0.72,
    recommendedResponse: stage >= 6 ? 'Reduce speed and move toward the verified high-sunlight safe zone.' : 'Continue monitoring the coordinated survey.',
  }
}

export function createIncident(reading: NexusTelemetryReading): NexusIncident {
  const m = reading.metrics
  const causalNodes = [
    { id: 'loose-soil', label: 'Loose lunar soil', kind: 'inferred_cause' as const, description: 'The scenario assumes loose regolith based on traction readings; camera confirmation is unavailable.', evidenceMetrics: ['terrainSlope', 'wheelResistance'] },
    { id: 'wheel-resistance', label: 'Wheel resistance', kind: 'detected_anomaly' as const, description: 'Left-wheel resistance exceeds the 42 N safe range.', evidenceMetrics: ['wheelResistance'] },
    { id: 'motor-load', label: 'Motor load', kind: 'inferred_cause' as const, description: 'Higher drive current follows the resistance increase.', evidenceMetrics: ['motorCurrent', 'wheelVibration'] },
    { id: 'motor-temperature', label: 'Motor temperature', kind: 'detected_anomaly' as const, description: 'Thermal trend is inconsistent with nominal traverse load.', evidenceMetrics: ['motorTemperature'] },
    { id: 'battery-drain', label: 'Accelerated drain', kind: 'inferred_cause' as const, description: 'Drive-system load increases battery discharge.', evidenceMetrics: ['batteryDischargeRate', 'batteryVoltage'] },
    { id: 'operating-time', label: 'Reduced operating time', kind: 'predicted_outcome' as const, description: 'Energy model predicts reserve breach before the original destination.', evidenceMetrics: ['battery', 'solarOutput', 'remainingOperatingMinutes'] },
    { id: 'mission-risk', label: 'Mission objective risk', kind: 'recommended_action' as const, description: 'The original route is no longer inside the autonomy envelope.', evidenceMetrics: ['safeZoneDistance'] },
  ]
  return {
    id: MISSION_CONFIG.incident.id, title: MISSION_CONFIG.incident.name,
    timestamp: reading.timestamp, affectedAssets: ['astra-1', 'nova', 'selene'],
    affectedComponents: ['left-wheel', 'drive-motor', 'primary-battery', 'solar-array'],
    severity: 'high', confidence: 0.92,
    evidence: [
      { metric: 'wheelResistance', label: 'Wheel resistance', value: m.wheelResistance, unit: 'N', expectedRange: '18–42 N', assetId: 'astra-1', kind: 'verified_observation' },
      { metric: 'wheelVibration', label: 'Wheel vibration', value: m.wheelVibration, unit: 'mm/s', expectedRange: '0.5–3.5 mm/s', assetId: 'astra-1', kind: 'detected_anomaly' },
      { metric: 'motorTemperature', label: 'Motor temperature', value: m.motorTemperature, unit: '°C', expectedRange: '−10–58 °C', assetId: 'astra-1', kind: 'detected_anomaly' },
      { metric: 'batteryDischargeRate', label: 'Battery discharge', value: m.batteryDischargeRate, unit: '%/h', expectedRange: '0.4–1.1 %/h', assetId: 'astra-1', kind: 'predicted_outcome' },
      { metric: 'solarOutput', label: 'Solar output', value: m.solarOutput, unit: 'W', expectedRange: '110–190 W', assetId: 'astra-1', kind: 'verified_observation' },
    ],
    probableRootCause: 'Loose lunar regolith may be increasing left-wheel resistance and drive-system load.',
    alternativeCauses: ['Drive bearing degradation', 'Wheel-resistance sensor bias', 'Unexpected terrain gradient'],
    missingInformation: ['Forward wheel-camera imagery is unavailable during the Earth blackout.'],
    recommendedObservation: `Task ${MISSION_CONFIG.assets.support.name} with a low-altitude terrain scan before approving the route.`,
    status: 'awaiting_approval', causalNodes,
    causalLinks: [
      { source: 'loose-soil', target: 'wheel-resistance', relation: 'may raise', confidence: 0.91, edgeType: 'operator_assumption', evidence: ['Wheel resistance', 'Terrain slope'], method: 'Operator terrain assumption supported by traction readings', timestampRange: reading.timestamp, confidenceMethod: '[NEEDS METHOD]', limitation: 'No wheel-camera evidence confirms regolith composition.' },
      { source: 'wheel-resistance', target: 'motor-load', relation: 'increases with', confidence: 0.94, edgeType: 'measured_relationship', evidence: ['Wheel resistance', 'Motor current'], method: 'Recorded cross-sensor ordering', timestampRange: reading.timestamp, confidenceMethod: '[NEEDS METHOD]', limitation: 'Association does not isolate all mechanical causes.' },
      { source: 'motor-load', target: 'motor-temperature', relation: 'may increase', confidence: 0.89, edgeType: 'rule_based_inference', evidence: ['Motor current', 'Motor temperature', 'Vibration'], method: 'Cross-sensor rule', timestampRange: reading.timestamp, confidenceMethod: '[NEEDS METHOD]', limitation: 'The rule is not a thermal system-identification model.' },
      { source: 'motor-temperature', target: 'battery-drain', relation: 'co-occurs with', confidence: 0.86, edgeType: 'model_association', evidence: ['Battery discharge rate', 'Battery voltage'], method: 'Temporal association in the seeded observation window', timestampRange: reading.timestamp, confidenceMethod: '[NEEDS METHOD]', limitation: 'Co-occurrence does not establish direct causation.' },
      { source: 'battery-drain', target: 'operating-time', relation: 'reduces', confidence: 0.95, edgeType: 'rule_based_inference', evidence: ['Battery', 'Solar output', 'Remaining operating minutes'], method: 'Scenario energy rule', timestampRange: reading.timestamp, confidenceMethod: '[NEEDS METHOD]', limitation: 'Operating time is a simulated scenario value.' },
      { source: 'operating-time', target: 'mission-risk', relation: 'may threaten', confidence: 0.88, edgeType: 'operator_assumption', evidence: ['Safe-zone distance', 'Battery reserve'], method: 'Mission policy assumption', timestampRange: reading.timestamp, confidenceMethod: '[NEEDS METHOD]', limitation: 'No calibrated mission-loss probability model is available.' },
    ],
    observation: `Wheel resistance is ${m.wheelResistance.toFixed(1)} N, motor temperature is ${m.motorTemperature.toFixed(1)} °C and battery discharge is ${m.batteryDischargeRate.toFixed(2)}%/h.`,
    detectionMethod: 'Manual scenario event plus threshold, trend and cross-sensor rules. Backend Isolation Forest is implemented; this local incident uses a fixed fixture.',
    supportingEvidence: 'Wheel resistance, vibration and motor temperature increased in the same recorded window.',
    inference: 'Loose terrain may be increasing drive-system load.',
    prediction: `The scenario generator reports ${m.remainingOperatingMinutes.toFixed(0)} remaining operating minutes. This is simulated.`,
    recommendation: `Ask ${MISSION_CONFIG.assets.support.name} to scan the route before ${MISSION_CONFIG.assets.primary.name} moves.`,
    limitation: 'Wheel-camera imagery is unavailable, and frontend incident confidence lacks a calculation method.',
  }
}

export function createCouncil(risk: RiskAssessmentNexus): AgentAssessment[] {
  return [
    { agentId: 'systems-engineer', role: 'SYSTEMS_ENGINEER', finding: 'The signal order matches external terrain load rather than an isolated sensor fault.', evidence: ['Resistance rose before heat', 'Motor current and vibration correlate', 'Anomaly persists across six samples'], proposedAction: 'Reduce drive speed to 0.12 m/s and cap motor temperature at 82°C.', confidence: 0.91, tradeoff: 'Traverse time increases; motor stress is reduced.', safetyStatus: 'validated', limitation: 'No wheel-camera evidence is available.', methodStatus: 'Rule-based' },
    { agentId: 'navigator', role: 'NAVIGATOR', finding: 'The scenario route avoids configured high-resistance cells.', evidence: ['Static fallback route score', `${MISSION_CONFIG.assets.support.name} can verify uncertain cells`, `${MISSION_CONFIG.assets.relay.name} provides local relay coverage`], proposedAction: `Scan the corridor with ${MISSION_CONFIG.assets.support.name}, then follow the high-sunlight rescue route.`, confidence: 0.89, tradeoff: 'Adds time for terrain verification.', safetyStatus: 'validated', limitation: 'The local frontend route is static unless backend A* data is loaded.', methodStatus: 'Rule-based' },
    { agentId: 'energy-manager', role: 'ENERGY_MANAGER', finding: 'The original route may breach the configured emergency reserve.', evidence: ['Solar output is declining', 'Discharge exceeds the scenario threshold', 'Safe-zone sunlight is a scenario value'], proposedAction: 'Pause non-essential instruments and enter power-conservation mode.', confidence: 0.94, tradeoff: 'Two science observations are deferred.', safetyStatus: 'validated', limitation: 'The reserve forecast is not calibrated against flight data.', methodStatus: 'Rule-based' },
    { agentId: 'science-officer', role: 'SCIENCE_OFFICER', finding: 'The ice-rich signature warrants review, but immediate sampling adds mobility risk.', evidence: ['Scenario discovery confidence', 'Coordinates and spectra are preserved', `${MISSION_CONFIG.assets.support.name} can carry priority observations`], proposedAction: `Transfer critical research data to ${MISSION_CONFIG.assets.support.name} and defer drilling.`, confidence: 0.86, tradeoff: 'Short-term sampling time is lost; discovery evidence is protected.', safetyStatus: 'validated', limitation: 'Scientific classification requires instrument confirmation.', methodStatus: 'Rule-based' },
    { agentId: 'safety-auditor', role: 'SAFETY_AUDITOR', finding: 'The rescue proposal satisfies configured energy, thermal and terrain constraints.', evidence: [`Calculated mission risk ${risk.score.toFixed(0)}/100`, 'Emergency reserve retained', 'Irreversible actions remain locked', `${MISSION_CONFIG.assets.support.name} scan closes the main evidence gap`], proposedAction: `Approve only after ${MISSION_CONFIG.assets.support.name} confirms uncertain terrain segments.`, confidence: 0.93, tradeoff: 'The confirmation scan increases response time.', safetyStatus: 'validated', limitation: 'Constraint thresholds are prototype policy values.', methodStatus: 'Rule-based' },
    { agentId: 'mission-director', role: 'MISSION_DIRECTOR', finding: 'Council rules favor coordinated rescue over continuing the original route.', evidence: ['Five domain assessments evaluated', 'Safety rules passed', 'Rescue branch has the highest scenario score'], proposedAction: `Reduce speed, transfer data to ${MISSION_CONFIG.assets.support.name}, use ${MISSION_CONFIG.assets.relay.name} as relay and travel to the high-sunlight safe zone.`, confidence: 0.92, tradeoff: 'Scientific sampling pauses temporarily.', safetyStatus: 'validated', limitation: 'The synthesis is a deterministic template, not hidden model reasoning.', methodStatus: 'Rule-based' },
  ]
}

export const DEFAULT_FUTURE_INPUTS: FutureInputs = {
  roverSpeed: 0.16, solarOutput: 58, terrainResistance: 72, communicationDuration: 45,
  motorTemperature: 74, batteryLevel: 49, radiation: 0.38, safeZoneDistance: 1.8,
}

export function compareNexusFutures(inputs: FutureInputs): FutureScenarioNexus[] {
  const energyPressure = Math.max(0, 70 - inputs.batteryLevel) * 0.55 + Math.max(0, 95 - inputs.solarOutput) * 0.19
  const terrainPressure = inputs.terrainResistance * 0.42
  const thermalPressure = Math.max(0, inputs.motorTemperature - 55) * 0.92
  const commPressure = Math.min(100, inputs.communicationDuration / 2.4)
  const distancePressure = Math.min(100, inputs.safeZoneDistance * 12)
  const pressure = energyPressure + terrainPressure + thermalPressure + commPressure * 0.18
  const travel = inputs.safeZoneDistance / Math.max(inputs.roverSpeed, 0.04) * 60
  return [
    { id: 'future-original', name: 'Continue Original Mission', missionSuccessProbability: clamp(94 - pressure * 0.72 - distancePressure * 0.16), remainingBattery: clamp(inputs.batteryLevel - inputs.safeZoneDistance * 15 - terrainPressure * 0.12), componentFailureRisk: clamp(18 + pressure * 0.82), travelTimeMinutes: Math.round(travel * 0.86), scientificValuePreserved: 91, communicationAvailability: clamp(100 - commPressure), safetyScore: clamp(82 - pressure * 0.82), mainRisks: ['Motor stress remains unmitigated', 'Original route crosses loose regolith', 'Battery reserve may be violated'], confidence: 0.83, recommended: false, simulatedPrediction: true },
    { id: 'future-conserve', name: 'Enter Power-Conservation Mode', missionSuccessProbability: clamp(101 - pressure * 0.43 - distancePressure * 0.12), remainingBattery: clamp(inputs.batteryLevel - inputs.safeZoneDistance * 8.4), componentFailureRisk: clamp(12 + pressure * 0.53), travelTimeMinutes: Math.round(travel * 1.34), scientificValuePreserved: 68, communicationAvailability: clamp(100 - commPressure * 0.82), safetyScore: clamp(88 - pressure * 0.53), mainRisks: ['Longer exposure before reaching sunlight', 'Two science tasks must be deferred'], confidence: 0.89, recommended: false, simulatedPrediction: true },
    { id: 'future-rescue', name: 'Council-Coordinated Rescue Route', missionSuccessProbability: clamp(108 - pressure * 0.31 - distancePressure * 0.08), remainingBattery: clamp(inputs.batteryLevel - inputs.safeZoneDistance * 7.1 + 4), componentFailureRisk: clamp(8 + pressure * 0.38), travelTimeMinutes: Math.round(travel * 1.08), scientificValuePreserved: 84, communicationAvailability: clamp(76 - commPressure * 0.22), safetyScore: clamp(97 - pressure * 0.38), mainRisks: [`Route depends on ${MISSION_CONFIG.assets.support.name} terrain scan`, 'High-risk movement requires human approval'], confidence: 0.92, recommended: true, simulatedPrediction: true },
  ]
}

export function createRecoveryPlan(): CoordinatedRecoveryPlan {
  return {
    id: 'plan-nightfall-rescue', name: `Coordinated ${MISSION_CONFIG.incident.name}`, route: RESCUE_ROUTE,
    actions: [
      [`Reduce ${MISSION_CONFIG.assets.primary.name} speed to 0.12 m/s`, ['astra-1'], 'preapproved'],
      ['Pause non-essential experiments and enter energy-saving mode', ['astra-1'], 'preapproved'],
      [`Task ${MISSION_CONFIG.assets.support.name} with a terrain scan of the alternative route`, ['nova'], 'preapproved'],
      [`Transfer critical scientific data from ${MISSION_CONFIG.assets.primary.name} to ${MISSION_CONFIG.assets.support.name}`, ['astra-1', 'nova'], 'preapproved'],
      [`Configure ${MISSION_CONFIG.assets.relay.name} as the local communication relay`, ['selene', 'astra-1', 'nova'], 'preapproved'],
      ['Approve movement onto the A* high-sunlight rescue route', ['astra-1'], 'human_approval'],
      ['Monitor battery reserve, motor temperature and route confidence every 20 seconds', ['astra-1', 'nova', 'selene'], 'preapproved'],
    ].map(([action, assets, autonomy], index) => ({ order: index + 1, action: action as string, participatingAssets: assets as AssetId[], autonomyClass: autonomy as 'preapproved' | 'human_approval', completed: false })),
    estimatedEnergyWh: 492, estimatedDurationMinutes: 144, safetyScore: 82,
    scientificValueScore: 84, missionSuccessProbability: 87,
    advantages: ['Protects the 20% battery reserve', 'Reduces motor stress', 'Preserves priority science data', `Coordinates ${MISSION_CONFIG.assets.support.name} and ${MISSION_CONFIG.assets.relay.name} during blackout`],
    tradeoffs: ['Pauses two science tasks', 'Adds a terrain-scan delay', 'Requires operator approval for movement'],
    rejectedAlternatives: ['Original route rejected: high terrain and motor stress', 'Full stop rejected: lunar night would reduce recoverable solar energy'],
    status: 'awaiting_approval', safetyValidated: true,
  }
}

export function createCommunication(stage: number): CommunicationState {
  return {
    earthConnected: stage < 7, delaySeconds: stage < 7 ? 1.28 : 0,
    blackoutRemainingSeconds: stage >= 7 ? 3600 : 0,
    nextWindowAt: new Date(Date.now() + (stage >= 7 ? 3600 : 2640) * 1000).toISOString(),
    permittedActions: ['Reduce speed', 'Enter energy-saving mode', 'Pause non-essential experiments', 'Move to a verified safe waypoint', 'Transfer data to another mission asset'],
    approvalRequiredActions: ['Cross unverified terrain', 'Disable a safety-critical subsystem', 'Abandon an asset', 'Exceed thermal or battery limits'],
  }
}

export const INITIAL_OPPORTUNITIES: ScienceOpportunityNexus[] = [
  { id: 'science-ice-signature', title: 'Possible ice-rich regolith signature', assetId: 'astra-1', confidence: 0.84, scientificValue: 94, requiredEnergy: 68, timeCostMinutes: 42, missionRisk: 28, supportingData: ['Neutron count 18% below local baseline', 'Surface albedo +11%', 'Thermal inertia consistent with buried volatiles'], recommendation: 'Perform a low-energy confirmation scan before sampling.', decision: 'pending' },
  { id: 'science-crater-rim', title: 'Young micro-crater ejecta formation', assetId: 'nova', confidence: 0.77, scientificValue: 72, requiredEnergy: 21, timeCostMinutes: 18, missionRisk: 19, supportingData: ['Sharp rim morphology in stereo imagery', 'Unweathered high-reflectance ejecta'], recommendation: `Allow ${MISSION_CONFIG.assets.support.name} to complete a passive image sweep while scanning the rescue route.`, decision: 'pending' },
  { id: 'science-radiation-pattern', title: 'Localized radiation shielding pattern', assetId: 'selene', confidence: 0.69, scientificValue: 64, requiredEnergy: 12, timeCostMinutes: 25, missionRisk: 8, supportingData: ['Dose rate 9% below surrounding terrain', 'Pattern repeats across three sensor passes'], recommendation: 'Archive as a future investigation region; no mission diversion required.', decision: 'pending' },
]

export const MEMORY_NODES: MemoryNode[] = [
  { id: 'asset-nova', type: 'asset', label: MISSION_CONFIG.assets.support.name, x: 8, y: 16, evidenceIds: ['nova'] },
  { id: 'asset-astra', type: 'asset', label: MISSION_CONFIG.assets.primary.name, x: 8, y: 48, evidenceIds: ['astra-1'] },
  { id: 'asset-selene', type: 'asset', label: MISSION_CONFIG.assets.relay.name, x: 8, y: 82, evidenceIds: ['selene'] },
  { id: 'component-wheel', type: 'component', label: 'Left wheel', x: 24, y: 24, evidenceIds: ['wheelResistance'] },
  { id: 'telemetry-load', type: 'telemetry', label: 'Correlated load signals', x: 24, y: 72, evidenceIds: ['wheelVibration', 'motorTemperature'] },
  { id: 'incident-nightfall', type: 'incident', label: MISSION_CONFIG.incident.name, x: 43, y: 48, evidenceIds: [MISSION_CONFIG.incident.id] },
  { id: 'cause-soil', type: 'cause', label: 'Loose regolith', x: 59, y: 23, evidenceIds: ['wheelResistance'] },
  { id: 'constraint-reserve', type: 'constraint', label: '20% battery reserve', x: 59, y: 74, evidenceIds: ['battery'] },
  { id: 'recommend-rescue', type: 'recommendation', label: 'Council rescue plan', x: 77, y: 48, evidenceIds: ['plan-nightfall-rescue'] },
  { id: 'decision-human', type: 'decision', label: 'Human decision', x: 92, y: 28, evidenceIds: ['approval'] },
  { id: 'outcome-recovery', type: 'outcome', label: 'Predicted recovery', x: 92, y: 72, evidenceIds: ['future-rescue'] },
]

export const MEMORY_LINKS: MemoryLink[] = [
  { source: 'asset-nova', target: 'incident-nightfall', relation: 'observes' },
  { source: 'asset-astra', target: 'component-wheel', relation: 'contains' },
  { source: 'asset-astra', target: 'telemetry-load', relation: 'produces' },
  { source: 'asset-selene', target: 'incident-nightfall', relation: 'relays' },
  { source: 'component-wheel', target: 'incident-nightfall', relation: 'supports' },
  { source: 'telemetry-load', target: 'incident-nightfall', relation: 'confirms' },
  { source: 'incident-nightfall', target: 'cause-soil', relation: 'infers' },
  { source: 'incident-nightfall', target: 'constraint-reserve', relation: 'threatens' },
  { source: 'cause-soil', target: 'recommend-rescue', relation: 'motivates' },
  { source: 'constraint-reserve', target: 'recommend-rescue', relation: 'constrains' },
  { source: 'recommend-rescue', target: 'decision-human', relation: 'requires' },
  { source: 'recommend-rescue', target: 'outcome-recovery', relation: 'predicts' },
]

export const INITIAL_NEXUS_AUDIT: NexusAuditEvent[] = [
  { id: 'audit-init', timestamp: new Date().toISOString(), category: 'SYSTEM', action: 'MISSION_TWINS_SYNCHRONIZED', actor: 'SYSTEM', details: `${MISSION_CONFIG.assets.primary.name}, ${MISSION_CONFIG.assets.support.name} and ${MISSION_CONFIG.assets.relay.name} digital twins synchronized with seeded simulated telemetry.`, severity: 'info' },
]

export function createAudit(action: string, details: string, severity: NexusAuditEvent['severity'] = 'info', actor = 'MISSION_CONTROLLER'): NexusAuditEvent {
  return { id: `audit-${Date.now()}-${Math.round(Math.random() * 1000)}`, timestamp: new Date().toISOString(), category: action.split('_')[0], action, actor, details, severity }
}

export function buildMissionReportHtml(args: {
  mission: NexusMission
  assets: NexusAsset[]
  incident?: NexusIncident
  council: AgentAssessment[]
  futures: FutureScenarioNexus[]
  plan?: CoordinatedRecoveryPlan
  audit: NexusAuditEvent[]
}) {
  const { mission, assets, incident, council, futures, plan, audit } = args
  const rows = assets.map(asset => `<tr><td>${asset.name}</td><td>${asset.health.toFixed(0)}%</td><td>${asset.energy.toFixed(0)}%</td><td>${asset.status}</td><td>${asset.activity}</td></tr>`).join('')
  const councilItems = council.map(item => `<li><strong>${item.role.replace(/_/g, ' ')}:</strong> ${item.finding} — ${item.proposedAction}. Confidence: [NEEDS METHOD]. Limitation: ${item.limitation}</li>`).join('') || '<li>Mission Council has not been activated.</li>'
  const futureRows = futures.map(item => `<tr><td>${item.name}</td><td>${item.missionSuccessProbability.toFixed(0)}/100 simulated outcome</td><td>${item.safetyScore.toFixed(0)}</td><td>${item.remainingBattery.toFixed(0)}%</td></tr>`).join('')
  const timeline = audit.slice(0, 18).map(item => `<li>${new Date(item.timestamp).toLocaleString()} — <strong>${item.action.replace(/_/g, ' ')}</strong>: ${item.details}</li>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>AstraTwin Nexus Mission Report</title><style>body{font:14px/1.55 Arial,sans-serif;color:#142033;max-width:980px;margin:32px auto;padding:0 24px}h1{color:#073b61}h2{margin-top:28px;color:#105a83}.notice{padding:12px;border:1px solid #d69000;background:#fff8e5}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e8f3f8}footer{margin-top:36px;color:#667085;font-size:12px}@media print{body{margin:0}}</style></head><body><h1>ASTRATWIN NEXUS — ${mission.name}</h1><p class="notice">${MISSION_CONFIG.limitation}</p><p>Generated ${new Date().toUTCString()}. Mission health ${mission.overallHealth.toFixed(0)}/100 (scenario value). Mission success: Not calculated.</p><h2>Asset health</h2><table><thead><tr><th>Asset</th><th>Health</th><th>Energy</th><th>Status</th><th>Activity</th></tr></thead><tbody>${rows}</tbody></table><h2>Incident relationship assessment</h2><p>${incident ? `<strong>${incident.title}</strong> — ${incident.probableRootCause} Confidence: [NEEDS METHOD]. Missing information: ${incident.missingInformation.join('; ')}` : 'No serious incident is active.'}</p><h2>Failure prediction</h2><p>Not calculated in the fixed frontend snapshot. The backend contains a deterministic stress formula, but this report has no hydrated prediction result.</p><h2>Mission Council findings</h2><ul>${councilItems}</ul><h2>Compared futures</h2><table><thead><tr><th>Future</th><th>Scenario outcome</th><th>Safety</th><th>Remaining battery</th></tr></thead><tbody>${futureRows}</tbody></table><h2>Selected recovery plan</h2><p>${plan ? `<strong>${plan.name}</strong> — status: ${plan.status}; safety ${plan.safetyScore}/100 (static fallback); mission success: Not calculated.` : 'No recovery plan is required.'}</p><h2>Incident timeline and audit</h2><ul>${timeline}</ul><h2>Methods and limitations</h2><ul><li>Telemetry is produced by a seeded simulation.</li><li>Wheel-camera evidence may be unavailable during blackout.</li><li>Future outputs are deterministic sensitivity estimates.</li></ul><footer>Human approval is required for high-risk or irreversible actions. Simulation only.</footer></body></html>`
}
