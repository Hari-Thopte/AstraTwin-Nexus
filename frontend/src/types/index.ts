// ── Status & Severity ──────────────────────────────────────────────────────
export type SystemStatus = 'NOMINAL' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type CommStatus = 'CONNECTED' | 'DELAYED' | 'INTERMITTENT' | 'LOST'

// ── Mission ───────────────────────────────────────────────────────────────
export interface Mission {
  id: string
  name: string
  rover: string
  description: string
  startDate: string          // ISO 8601
  plannedEndDate: string
  currentPhase: MissionPhase
  coordinates: Coordinates
  distanceTravelled: number  // km
  totalPlannedDistance: number
  objectivesCompleted: number
  totalObjectives: number
}

export type MissionPhase =
  | 'Earth Launch'
  | 'Trans-Lunar Flight'
  | 'Lunar Orbit'
  | 'Surface Operations'
  | 'Contingency Operations'
  | 'TRANSIT'
  | 'ORBITAL_INSERTION'
  | 'DESCENT'
  | 'SURFACE_OPS'
  | 'SAMPLE_COLLECTION'
  | 'ASCENT'
  | 'RETURN'

export interface Coordinates {
  lat: number
  lon: number
  elevation: number   // metres relative to mean lunar radius
  reference: string   // Mission configuration region reference
}

// ── Rover & Components ────────────────────────────────────────────────────
export interface Rover {
  id: string
  name: string
  model: string
  launchDate: string
  overallHealth: number   // 0-100
  status: SystemStatus
  commStatus: CommStatus
  commDelay: number       // seconds one-way
  powerLevel: number      // percentage
  batteryTemp: number     // Celsius
}

export interface Component {
  id: string
  name: string
  category: ComponentCategory
  health: number          // 0-100
  status: SystemStatus
  lastCalibration: string
  hoursOperated: number
  maxHours: number
  criticalThreshold: number
  warningThreshold: number
  metadata?: Record<string, string | number>
}

export type ComponentCategory =
  | 'POWER'
  | 'THERMAL'
  | 'MOBILITY'
  | 'COMMUNICATION'
  | 'SCIENCE'
  | 'NAVIGATION'
  | 'COMPUTE'

export interface ComponentHealth {
  componentId: string
  timestamp: string
  health: number
  status: SystemStatus
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING'
  degradationRate: number   // percentage per sol
}

// ── Telemetry ─────────────────────────────────────────────────────────────
export interface TelemetryReading {
  id: string
  timestamp: string
  missionElapsedTime: number   // seconds
  // Power
  batteryCharge: number        // percentage
  solarPanelOutput: number     // watts
  powerConsumption: number     // watts
  // Thermal
  coreTemp: number             // Celsius
  batteryTemp: number          // Celsius
  motorTemp: number            // Celsius
  // Mobility
  wheelSpeed: number           // m/s
  wheelTorque: number          // N·m
  terrainSlope: number         // degrees
  // Communication
  signalStrength: number       // dBm
  dataRate: number             // kbps
  // Science
  radiationLevel: number       // mSv/h
  dustAccumulation: number     // g/m²
  // System
  cpuLoad: number              // percentage
  memoryUsage: number          // percentage
  overallHealth: number        // 0-100
  status: SystemStatus
}

// ── Anomalies ─────────────────────────────────────────────────────────────
export interface Anomaly {
  id: string
  detectedAt: string
  componentId: string
  componentName: string
  title: string
  description: string
  severity: Severity
  status: AnomalyStatus
  confidence: number          // 0-1
  affectedMetrics: string[]
  suggestedActions: string[]
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
}

export type AnomalyStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'DISMISSED'

// ── Failure Forecasting ───────────────────────────────────────────────────
export interface FailurePrediction {
  id: string
  componentId: string
  componentName: string
  generatedAt: string
  predictedFailureDate: string
  timeToFailure: number        // hours
  probability: number          // 0-1
  severity: Severity
  failureMode: string
  contributingFactors: string[]
  confidenceInterval: {
    lower: number
    upper: number
  }
  recommendedAction: string
  urgency: 'MONITOR' | 'SCHEDULE' | 'IMMEDIATE'
}

// ── Mission Constraints & Recovery ────────────────────────────────────────
export interface MissionConstraint {
  id: string
  type: ConstraintType
  description: string
  value: number
  unit: string
  hardLimit: boolean
  currentValue: number
  status: 'SATISFIED' | 'AT_RISK' | 'VIOLATED'
}

export type ConstraintType =
  | 'POWER_BUDGET'
  | 'THERMAL_LIMIT'
  | 'COMMUNICATION_WINDOW'
  | 'TERRAIN_SLOPE'
  | 'SCIENCE_TIMELINE'
  | 'CONSUMABLE'

export interface Route {
  id: string
  name: string
  waypoints: Waypoint[]
  totalDistance: number
  estimatedDuration: number  // hours
  riskScore: number          // 0-100
  scienceValue: number       // 0-100
  powerRequired: number      // watt-hours
}

export interface Waypoint {
  id: string
  name: string
  coordinates: Coordinates
  action?: string
  estimatedArrival?: string
  completed: boolean
}

export interface RecoveryPlan {
  id: string
  title: string
  description: string
  trigger: string
  priority: number
  estimatedDuration: number   // hours
  steps: RecoveryStep[]
  riskReduction: number       // percentage
  powerCost: number           // watt-hours
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  generatedAt: string
  approvedAt?: string
  approvedBy?: string
}

export interface RecoveryStep {
  order: number
  action: string
  duration: number   // minutes
  automated: boolean
  requiresApproval: boolean
  notes?: string
}

export interface PlanEvaluation {
  planId: string
  evaluatedAt: string
  overallScore: number
  feasibility: number
  riskScore: number
  powerFeasible: boolean
  timeFeasible: boolean
  pros: string[]
  cons: string[]
  recommendation: string
}

// ── What-If Simulation ────────────────────────────────────────────────────
export interface SimulationScenario {
  id: string
  name: string
  description: string
  category: ScenarioCategory
  parameters: SimulationParameter[]
  createdAt: string
  lastRunAt?: string
  status: 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  results?: SimulationResult
}

export type ScenarioCategory =
  | 'FAILURE_MODE'
  | 'ENVIRONMENT'
  | 'MISSION_CHANGE'
  | 'RESOURCE_CONSTRAINT'
  | 'RECOVERY_TEST'

export interface SimulationParameter {
  key: string
  label: string
  value: number | string | boolean
  type: 'number' | 'string' | 'boolean' | 'select'
  min?: number
  max?: number
  options?: string[]
  unit?: string
}

export interface SimulationResult {
  scenarioId: string
  completedAt: string
  outcomeStatus: SystemStatus
  missionSuccessProbability: number
  estimatedImpact: string
  metrics: Record<string, number>
  warnings: string[]
  recommendations: string[]
}

// ── Simulation Engine State ───────────────────────────────────────────────
export type SimulationSpeed = 1 | 2 | 5 | 10 | 50

export interface SimulationState {
  isRunning: boolean
  speed: SimulationSpeed
  currentTick: number
  missionElapsedTime: number   // seconds
  startedAt: string
  pausedAt?: string
  lastTickAt?: string
}

// ── AI Explainability ─────────────────────────────────────────────────────
export interface AIExplanation {
  id: string
  decisionId: string
  decisionType: 'ANOMALY_DETECTION' | 'FAILURE_PREDICTION' | 'PLAN_RECOMMENDATION' | 'ROUTE_SELECTION'
  generatedAt: string
  summary: string
  reasoning: string[]
  confidence: number
  featureImportance: FeatureImportance[]
  alternativesConsidered: AlternativeOption[]
  limitations: string[]
}

export interface FeatureImportance {
  feature: string
  importance: number   // 0-1
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  value: number | string
}

export interface AlternativeOption {
  description: string
  score: number
  rejectionReason: string
}

// ── Approval Workflow ─────────────────────────────────────────────────────
export interface ApprovalDecision {
  id: string
  itemType: 'RECOVERY_PLAN' | 'ROUTE_CHANGE' | 'SIMULATION_RESULT' | 'OVERRIDE'
  itemId: string
  title: string
  requestedAt: string
  requestedBy: string
  urgency: Severity
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  reviewedAt?: string
  reviewedBy?: string
  comment?: string
}

// ── Audit ─────────────────────────────────────────────────────────────────
export interface AuditEvent {
  id: string
  timestamp: string
  category: AuditCategory
  action: string
  actor: string           // 'AI_SYSTEM' | 'MISSION_CONTROLLER' | 'SYSTEM'
  target: string
  details: string
  severity: 'INFO' | 'WARNING' | 'ERROR'
  relatedIds?: string[]
}

export type AuditCategory =
  | 'DETECTION'
  | 'PREDICTION'
  | 'PLANNING'
  | 'SIMULATION'
  | 'APPROVAL'
  | 'OVERRIDE'
  | 'SYSTEM'
  | 'COMMUNICATION'

// ── Reports ───────────────────────────────────────────────────────────────
export interface MissionReport {
  id: string
  title: string
  type: ReportType
  generatedAt: string
  periodStart: string
  periodEnd: string
  summary: string
  highlights: string[]
  concerns: string[]
  metrics: ReportMetric[]
  status: 'DRAFT' | 'FINAL'
}

export type ReportType = 'DAILY' | 'SOL' | 'WEEKLY' | 'INCIDENT' | 'MILESTONE'

export interface ReportMetric {
  label: string
  value: number | string
  unit?: string
  trend?: 'UP' | 'DOWN' | 'STABLE'
  status?: SystemStatus
}

// ── App State (Zustand) ───────────────────────────────────────────────────
export interface AppState {
  mission: Mission | null
  rover: Rover | null
  components: Component[]
  latestTelemetry: TelemetryReading | null
  telemetryHistory: TelemetryReading[]
  anomalies: Anomaly[]
  predictions: FailurePrediction[]
  recoveryPlans: RecoveryPlan[]
  auditEvents: AuditEvent[]
  reports: MissionReport[]
  simulation: SimulationState
  pendingApprovals: ApprovalDecision[]
  isConnected: boolean
  lastUpdated: string | null
  activeNavItem: string
}
