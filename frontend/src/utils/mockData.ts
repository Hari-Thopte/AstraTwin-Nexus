import type {
  Mission,
  Rover,
  Component,
  TelemetryReading,
  Anomaly,
  FailurePrediction,
  RecoveryPlan,
  AuditEvent,
  MissionReport,
  SimulationState,
} from '../types'
import { MISSION_CONFIG } from '../config/mission'

// ── Mission ────────────────────────────────────────────────────────────────
export const INITIAL_MISSION: Mission = {
  id: MISSION_CONFIG.id,
  name: MISSION_CONFIG.name,
  rover: MISSION_CONFIG.assets.primary.name,
  description:
    'Characterise water-ice deposits in permanently shadowed regions near Shackleton crater. ' +
    'Collect regolith samples, map subsurface stratigraphy, and validate ISRU extraction sites.',
  startDate: '2025-01-15T08:00:00Z',
  plannedEndDate: '2025-07-15T08:00:00Z',
  currentPhase: MISSION_CONFIG.activePhase as Mission['currentPhase'],
  coordinates: {
    lat: MISSION_CONFIG.region.latitude,
    lon: MISSION_CONFIG.region.longitude,
    elevation: -1842,
    reference: MISSION_CONFIG.region.reference,
  },
  distanceTravelled: 2.4,
  totalPlannedDistance: 18.7,
  objectivesCompleted: 3,
  totalObjectives: 12,
}

// ── Rover ──────────────────────────────────────────────────────────────────
export const INITIAL_ROVER: Rover = {
  id: 'rover-astra-1',
  name: MISSION_CONFIG.assets.primary.name,
  model: 'LunarExplorer-MkIV',
  launchDate: '2024-11-20T14:32:00Z',
  overallHealth: 82,
  status: 'WARNING',
  commStatus: 'CONNECTED',
  commDelay: MISSION_CONFIG.communicationDelaySeconds,
  powerLevel: 74,
  batteryTemp: -8.4,
}

// ── Components ─────────────────────────────────────────────────────────────
export const INITIAL_COMPONENTS: Component[] = [
  {
    id: 'comp-battery',
    name: 'Primary Battery Array',
    category: 'POWER',
    health: 71,
    status: 'WARNING',
    lastCalibration: '2025-03-10T06:00:00Z',
    hoursOperated: 1847,
    maxHours: 5000,
    criticalThreshold: 40,
    warningThreshold: 70,
    metadata: { cells: 48, nominalVoltage: '28.8V', capacity: '1200Wh' },
  },
  {
    id: 'comp-solar',
    name: 'Solar Panel Array',
    category: 'POWER',
    health: 88,
    status: 'NOMINAL',
    lastCalibration: '2025-03-01T06:00:00Z',
    hoursOperated: 1847,
    maxHours: 10000,
    criticalThreshold: 30,
    warningThreshold: 60,
    metadata: { panels: 6, peakOutput: '180W', efficiency: '0.88' },
  },
  {
    id: 'comp-drive',
    name: 'Mobility Drive System',
    category: 'MOBILITY',
    health: 94,
    status: 'NOMINAL',
    lastCalibration: '2025-02-28T12:00:00Z',
    hoursOperated: 312,
    maxHours: 2000,
    criticalThreshold: 25,
    warningThreshold: 55,
    metadata: { wheels: 6, motorType: 'BLDC', maxSpeed: '0.12m/s' },
  },
  {
    id: 'comp-thermal',
    name: 'Thermal Control System',
    category: 'THERMAL',
    health: 79,
    status: 'WARNING',
    lastCalibration: '2025-03-05T08:00:00Z',
    hoursOperated: 1847,
    maxHours: 8000,
    criticalThreshold: 35,
    warningThreshold: 65,
    metadata: { heaters: 12, radiators: 4, setpointC: '-10' },
  },
  {
    id: 'comp-comms',
    name: 'High-Gain Antenna System',
    category: 'COMMUNICATION',
    health: 97,
    status: 'NOMINAL',
    lastCalibration: '2025-01-15T08:00:00Z',
    hoursOperated: 1847,
    maxHours: 15000,
    criticalThreshold: 40,
    warningThreshold: 70,
    metadata: { frequency: 'X-Band', uplink: '2kbps', downlink: '256kbps' },
  },
  {
    id: 'comp-drill',
    name: 'ISRU Drill & Sampler',
    category: 'SCIENCE',
    health: 63,
    status: 'DEGRADED',
    lastCalibration: '2025-02-14T10:00:00Z',
    hoursOperated: 94,
    maxHours: 500,
    criticalThreshold: 30,
    warningThreshold: 60,
    metadata: { maxDepth: '2m', bit: 'Tungsten-Carbide', samples: '3' },
  },
  {
    id: 'comp-nav',
    name: 'Autonomous Navigation Unit',
    category: 'NAVIGATION',
    health: 99,
    status: 'NOMINAL',
    lastCalibration: '2025-01-15T08:00:00Z',
    hoursOperated: 1847,
    maxHours: 20000,
    criticalThreshold: 50,
    warningThreshold: 75,
    metadata: { lidar: 'enabled', stereoVision: 'enabled', imu: '9DOF' },
  },
]

// ── Telemetry helper ───────────────────────────────────────────────────────
function generateTelemetry(offsetMinutes: number, index: number): TelemetryReading {
  const t = new Date('2025-04-07T10:00:00Z')
  t.setMinutes(t.getMinutes() - offsetMinutes)
  const noise = () => (Math.random() - 0.5) * 2
  const met = 6796800 - offsetMinutes * 60  // mission elapsed time in seconds

  return {
    id: `tel-${index}`,
    timestamp: t.toISOString(),
    missionElapsedTime: met,
    batteryCharge: Math.max(30, Math.min(98, 74 + noise() * 4)),
    solarPanelOutput: Math.max(0, 142 + noise() * 12),
    powerConsumption: Math.max(40, 88 + noise() * 8),
    coreTemp: -12 + noise() * 3,
    batteryTemp: -8.4 + noise() * 2,
    motorTemp: 14 + noise() * 5,
    wheelSpeed: index < 10 ? 0 : 0.08 + noise() * 0.02,
    wheelTorque: 3.2 + noise() * 0.8,
    terrainSlope: 2.1 + noise() * 1.5,
    signalStrength: -68 + noise() * 4,
    dataRate: 228 + noise() * 20,
    radiationLevel: 0.42 + noise() * 0.08,
    dustAccumulation: 1.2 + index * 0.002,
    cpuLoad: 34 + noise() * 12,
    memoryUsage: 52 + noise() * 6,
    overallHealth: Math.max(70, Math.min(98, 82 + noise() * 4)),
    status: 'NOMINAL',
  }
}

export const INITIAL_TELEMETRY_HISTORY: TelemetryReading[] = Array.from(
  { length: 50 },
  (_, i) => generateTelemetry((49 - i) * 5, i)
)

export const LATEST_TELEMETRY: TelemetryReading = {
  ...generateTelemetry(0, 50),
  id: 'tel-latest',
  batteryCharge: 74.2,
  solarPanelOutput: 141.8,
  powerConsumption: 88.4,
  coreTemp: -11.7,
  batteryTemp: -8.4,
  motorTemp: 14.2,
  wheelSpeed: 0.082,
  signalStrength: -68.1,
  dataRate: 228,
  radiationLevel: 0.42,
  cpuLoad: 34,
  memoryUsage: 52,
  overallHealth: 82,
  status: 'NOMINAL',
}

// ── Anomalies ──────────────────────────────────────────────────────────────
export const INITIAL_ANOMALIES: Anomaly[] = [
  {
    id: 'anom-001',
    detectedAt: '2025-04-07T08:14:22Z',
    componentId: 'comp-battery',
    componentName: 'Primary Battery Array',
    title: 'Elevated Self-Discharge Rate',
    description:
      'Battery state-of-charge is declining 14% faster than the baseline thermal model predicts for current temperatures. ' +
      'Cell group C3 is showing higher impedance growth consistent with early SEI layer thickening.',
    severity: 'medium',
    status: 'INVESTIGATING',
    confidence: 0.87,
    affectedMetrics: ['batteryCharge', 'batteryTemp', 'powerConsumption'],
    suggestedActions: [
      'Reduce non-critical payload power draw by 12W',
      'Schedule deep conditioning cycle during next long comms blackout',
      'Increase thermal heater setpoint for battery bay by +3°C',
    ],
  },
  {
    id: 'anom-002',
    detectedAt: '2025-04-06T22:41:05Z',
    componentId: 'comp-drill',
    componentName: 'ISRU Drill & Sampler',
    title: 'Drill Bit Vibration Anomaly',
    description:
      'Accelerometer readings on the drill spindle show resonant vibration at 47 Hz during Sample-3 collection. ' +
      'Vibration amplitude exceeds nominal envelope by 2.3σ. Possible bit wear or sub-surface rock encounter.',
    severity: 'high',
    status: 'OPEN',
    confidence: 0.92,
    affectedMetrics: ['wheelTorque', 'cpuLoad'],
    suggestedActions: [
      'Suspend drill operations pending controller review',
      'Run vibration diagnostic at reduced RPM (200 → 150)',
      'Inspect bit wear via downward camera before next sampling',
      'Consider alternate sampling site 14m NNE if rock obstruction confirmed',
    ],
  },
  {
    id: 'anom-003',
    detectedAt: '2025-04-07T09:55:44Z',
    componentId: 'comp-thermal',
    componentName: 'Thermal Control System',
    title: 'Heater Zone 4 Slow Response',
    description:
      'Heater Zone 4 (mobility bay) is taking 23% longer than expected to reach setpoint temperature after shadow ingress. ' +
      'Response degradation has been gradual over the past 18 sols — consistent with connector resistance creep.',
    severity: 'low',
    status: 'OPEN',
    confidence: 0.74,
    affectedMetrics: ['motorTemp', 'coreTemp'],
    suggestedActions: [
      'Log for monitoring over next 5 sols — no immediate action required',
      'Pre-heat mobility bay 45 min before planned traversal',
      'Flag connector J4-TH for inspection at next maintenance window',
    ],
  },
]

// ── Failure Predictions ────────────────────────────────────────────────────
export const INITIAL_PREDICTIONS: FailurePrediction[] = [
  {
    id: 'pred-001',
    componentId: 'comp-battery',
    componentName: 'Primary Battery Array',
    generatedAt: '2025-04-07T10:00:00Z',
    predictedFailureDate: '2025-05-12T00:00:00Z',
    timeToFailure: 840,
    probability: 0.68,
    severity: 'high',
    failureMode: 'Capacity fade below operational threshold (< 800 Wh)',
    contributingFactors: [
      'Accelerated SEI growth at low temperature (-12°C avg)',
      'Cumulative charge/discharge cycles (1847 vs rated 2000)',
      'Observed self-discharge anomaly (anom-001)',
    ],
    confidenceInterval: { lower: 0.51, upper: 0.81 },
    recommendedAction:
      'Schedule conditioning cycle within 96 hours; if capacity drops below 900 Wh, enter power-conservation mode.',
    urgency: 'SCHEDULE',
  },
  {
    id: 'pred-002',
    componentId: 'comp-drill',
    componentName: 'ISRU Drill & Sampler',
    generatedAt: '2025-04-07T10:00:00Z',
    predictedFailureDate: '2025-04-14T00:00:00Z',
    timeToFailure: 168,
    probability: 0.55,
    severity: 'high',
    failureMode: 'Drill bit fracture or spindle bearing seizure',
    contributingFactors: [
      'Vibration anomaly at 47 Hz resonance (anom-002)',
      'Bit operated 94 h vs rated 120 h before inspection',
      'Sub-surface basalt layer contact inferred from torque signature',
    ],
    confidenceInterval: { lower: 0.38, upper: 0.72 },
    recommendedAction:
      'Suspend drill operations immediately. Run reduced-RPM diagnostic. Replace bit at next EVA window.',
    urgency: 'IMMEDIATE',
  },
]

// ── Recovery Plans ─────────────────────────────────────────────────────────
export const INITIAL_RECOVERY_PLANS: RecoveryPlan[] = [
  {
    id: 'plan-001',
    title: 'Battery Conservation Protocol Alpha',
    description:
      'Graduated power reduction plan to extend battery life and prevent premature capacity fault. ' +
      'Targets 15% reduction in average power draw while maintaining core science objectives.',
    trigger: 'anom-001',
    priority: 1,
    estimatedDuration: 4,
    steps: [
      {
        order: 1,
        action: 'Disable non-critical heaters in payload bay (save 8W)',
        duration: 5,
        automated: true,
        requiresApproval: false,
      },
      {
        order: 2,
        action: 'Reduce downlink data rate from 256 kbps to 128 kbps',
        duration: 2,
        automated: true,
        requiresApproval: false,
      },
      {
        order: 3,
        action: 'Suspend spectrometer background scans until next sol',
        duration: 1,
        automated: false,
        requiresApproval: true,
        notes: 'Requires science team approval — affects Sol-22 spectral baseline',
      },
      {
        order: 4,
        action: 'Initiate battery conditioning cycle (deep discharge → full charge)',
        duration: 180,
        automated: true,
        requiresApproval: true,
        notes: 'Requires ground confirmation. Rover stationary for 3h',
      },
    ],
    riskReduction: 42,
    powerCost: -220,
    status: 'READY',
    generatedAt: '2025-04-07T08:30:00Z',
  },
  {
    id: 'plan-002',
    title: 'Drill Suspension & Diagnostic Protocol',
    description:
      'Immediate suspension of drill operations followed by vibration characterisation at reduced speed to assess bit integrity.',
    trigger: 'anom-002',
    priority: 0,
    estimatedDuration: 1.5,
    steps: [
      {
        order: 1,
        action: 'Emergency halt drill spindle motor',
        duration: 1,
        automated: true,
        requiresApproval: false,
      },
      {
        order: 2,
        action: 'Retract drill to safe stow position',
        duration: 8,
        automated: true,
        requiresApproval: false,
      },
      {
        order: 3,
        action: 'Capture high-resolution images of drill bit via nadir camera',
        duration: 3,
        automated: true,
        requiresApproval: false,
      },
      {
        order: 4,
        action: 'Transmit drill diagnostic telemetry package to ground',
        duration: 15,
        automated: true,
        requiresApproval: false,
      },
      {
        order: 5,
        action: 'Await ground controller GO/NO-GO for resumption',
        duration: 60,
        automated: false,
        requiresApproval: true,
        notes: 'Hold pending uplinkconfirmation from mission control',
      },
    ],
    riskReduction: 58,
    powerCost: 12,
    status: 'ACTIVE',
    generatedAt: '2025-04-07T09:00:00Z',
  },
]

// ── Audit Events ───────────────────────────────────────────────────────────
export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'audit-001',
    timestamp: '2025-04-07T10:01:14Z',
    category: 'DETECTION',
    action: 'ANOMALY_DETECTED',
    actor: 'AI_SYSTEM',
    target: 'comp-thermal',
    details: 'Heater Zone 4 slow response anomaly detected (anom-003). Confidence: 74%.',
    severity: 'WARNING',
    relatedIds: ['anom-003'],
  },
  {
    id: 'audit-002',
    timestamp: '2025-04-07T10:00:00Z',
    category: 'PREDICTION',
    action: 'FAILURE_FORECAST_UPDATED',
    actor: 'AI_SYSTEM',
    target: 'comp-battery',
    details: 'Battery failure probability updated to 68%. TTF: 840h. Urgency elevated to SCHEDULE.',
    severity: 'WARNING',
    relatedIds: ['pred-001'],
  },
  {
    id: 'audit-003',
    timestamp: '2025-04-07T09:00:12Z',
    category: 'PLANNING',
    action: 'RECOVERY_PLAN_ACTIVATED',
    actor: 'AI_SYSTEM',
    target: 'comp-drill',
    details: 'Drill Suspension & Diagnostic Protocol (plan-002) activated in response to anom-002.',
    severity: 'WARNING',
    relatedIds: ['plan-002', 'anom-002'],
  },
  {
    id: 'audit-004',
    timestamp: '2025-04-07T08:30:00Z',
    category: 'PLANNING',
    action: 'RECOVERY_PLAN_GENERATED',
    actor: 'AI_SYSTEM',
    target: 'comp-battery',
    details: 'Battery Conservation Protocol Alpha generated and queued for approval.',
    severity: 'INFO',
    relatedIds: ['plan-001', 'anom-001'],
  },
  {
    id: 'audit-005',
    timestamp: '2025-04-07T08:14:22Z',
    category: 'DETECTION',
    action: 'ANOMALY_DETECTED',
    actor: 'AI_SYSTEM',
    target: 'comp-battery',
    details: 'Elevated self-discharge rate detected (anom-001). Confidence: 87%. Isolation Forest model.',
    severity: 'WARNING',
    relatedIds: ['anom-001'],
  },
  {
    id: 'audit-006',
    timestamp: '2025-04-06T22:41:05Z',
    category: 'DETECTION',
    action: 'ANOMALY_DETECTED',
    actor: 'AI_SYSTEM',
    target: 'comp-drill',
    details: 'Drill vibration anomaly at 47 Hz detected (anom-002). Confidence: 92%. Spectral analysis.',
    severity: 'ERROR',
    relatedIds: ['anom-002'],
  },
  {
    id: 'audit-007',
    timestamp: '2025-04-06T18:00:00Z',
    category: 'SYSTEM',
    action: 'DAILY_HEALTH_REPORT_GENERATED',
    actor: 'SYSTEM',
    target: 'rover-astra-1',
    details: 'Sol-22 daily health report generated. Overall health: 82/100.',
    severity: 'INFO',
    relatedIds: ['report-001'],
  },
  {
    id: 'audit-008',
    timestamp: '2025-04-06T14:22:11Z',
    category: 'COMMUNICATION',
    action: 'COMM_WINDOW_CLOSED',
    actor: 'SYSTEM',
    target: 'ground-dss-43',
    details: 'DSS-43 Goldstone communication window ended. 128 MB transmitted. Next window: 06:00 UTC.',
    severity: 'INFO',
  },
]

// ── Reports ────────────────────────────────────────────────────────────────
export const INITIAL_REPORTS: MissionReport[] = [
  {
    id: 'report-001',
    title: 'Sol-22 Daily Health Report',
    type: 'SOL',
    generatedAt: '2025-04-06T18:00:00Z',
    periodStart: '2025-04-05T18:00:00Z',
    periodEnd: '2025-04-06T18:00:00Z',
    summary:
      'Sol 22 concluded with overall mission health at 82/100. ' +
      'Drill vibration anomaly logged during Sample-3 collection. Battery self-discharge trend continues. ' +
      'Navigation and communication systems performing nominally. Traverse of 0.34 km completed.',
    highlights: [
      'Sample-3 regolith core successfully collected from PSR-Alpha site',
      'Stereo camera mosaic of Shackleton Rim completed (1.2 GB)',
      'Radiation environment nominal — no SPE activity detected',
    ],
    concerns: [
      'Drill vibration anomaly — operations suspended pending review',
      'Battery capacity trending 6% below model prediction',
    ],
    metrics: [
      { label: 'Distance Traversed', value: 0.34, unit: 'km', trend: 'STABLE', status: 'NOMINAL' },
      { label: 'Energy Generated', value: 1842, unit: 'Wh', trend: 'STABLE', status: 'NOMINAL' },
      { label: 'Energy Consumed', value: 2118, unit: 'Wh', trend: 'UP', status: 'WARNING' },
      { label: 'Data Downlinked', value: 128, unit: 'MB', trend: 'STABLE', status: 'NOMINAL' },
      { label: 'Overall Health', value: 82, unit: '/100', trend: 'DOWN', status: 'WARNING' },
    ],
    status: 'FINAL',
  },
]

// ── Initial simulation state ───────────────────────────────────────────────
export const INITIAL_SIMULATION_STATE: SimulationState = {
  isRunning: false,
  speed: 1,
  currentTick: 0,
  missionElapsedTime: 1913760,  // ~22.1 sols in seconds
  startedAt: '2025-01-15T08:00:00Z',
  pausedAt: undefined,
  lastTickAt: undefined,
}
