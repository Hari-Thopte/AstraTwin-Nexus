export type AssetId = 'astra-1' | 'nova' | 'selene'
export type NexusStatus = 'normal' | 'warning' | 'high' | 'critical' | 'offline'
export type NexusSeverity = 'low' | 'medium' | 'high' | 'critical'
export type InformationMode = 'engineer' | 'commander' | 'public'
export type ScenarioName = 'lunar-nightfall-rescue' | 'communication-blackout' | null

export interface NexusMission {
  id: string
  name: string
  phase: string
  elapsedSeconds: number
  overallHealth: number
  successProbability: number
  objectivesCompleted: number
  totalObjectives: number
  latestRecommendation: string
}

export interface NexusComponent {
  id: string
  name: string
  health: number
  status: NexusStatus
  evidence: string
}

export interface NexusAsset {
  id: AssetId
  name: string
  kind: 'rover' | 'drone' | 'base'
  health: number
  energy: number
  communicationStrength: number
  activity: string
  coordinates: [number, number]
  mapPosition: [number, number]
  status: NexusStatus
  activeRisks: string[]
  components: NexusComponent[]
}

export interface NexusTelemetryReading {
  id: string
  assetId: AssetId
  timestamp: string
  missionElapsedTime: number
  scenarioStage: number
  metrics: Record<string, number>
  dataQuality: number
  observed: boolean
  seed: number
  dataOrigin: 'seeded_simulation'
  missingMetrics: string[]
  outlierMetrics: string[]
}

export type EvidenceKind =
  | 'verified_observation'
  | 'detected_anomaly'
  | 'inferred_cause'
  | 'predicted_outcome'
  | 'recommended_action'

export interface IncidentEvidence {
  metric: string
  label: string
  value: number
  unit: string
  expectedRange: string
  assetId: AssetId
  kind: EvidenceKind
}

export interface CausalNode {
  id: string
  label: string
  kind: EvidenceKind
  description: string
  evidenceMetrics: string[]
}

export interface CausalLink {
  source: string
  target: string
  relation: string
  confidence: number
  edgeType: 'measured_relationship' | 'rule_based_inference' | 'model_association' | 'operator_assumption' | 'needs_method'
  evidence: string[]
  method: string
  timestampRange: string
  confidenceMethod: string
  limitation: string
}

export interface NexusIncident {
  id: string
  title: string
  timestamp: string
  affectedAssets: AssetId[]
  affectedComponents: string[]
  severity: NexusSeverity
  confidence: number
  evidence: IncidentEvidence[]
  probableRootCause: string
  alternativeCauses: string[]
  missingInformation: string[]
  recommendedObservation: string
  status: 'monitoring' | 'confirmed' | 'council_active' | 'awaiting_approval' | 'approved' | 'rejected'
  causalNodes: CausalNode[]
  causalLinks: CausalLink[]
  observation: string
  detectionMethod: string
  supportingEvidence: string
  inference: string
  prediction: string
  recommendation: string
  limitation: string
}

export type AgentRole =
  | 'SYSTEMS_ENGINEER'
  | 'NAVIGATOR'
  | 'ENERGY_MANAGER'
  | 'SCIENCE_OFFICER'
  | 'SAFETY_AUDITOR'
  | 'MISSION_DIRECTOR'

export interface AgentAssessment {
  agentId: string
  role: AgentRole
  finding: string
  evidence: string[]
  proposedAction: string
  confidence: number
  tradeoff: string
  safetyStatus: 'pending' | 'validated' | 'challenged'
  limitation: string
  methodStatus: 'Rule-based'
}

export interface RoutePoint {
  x: number
  y: number
  sunlight: number
  terrainRisk: number
  communicationCoverage: number
}

export interface RescueRoute {
  id: string
  name: string
  points: RoutePoint[]
  distanceKm: number
  estimatedEnergyWh: number
  durationMinutes: number
  safetyScore: number
  scienceValue: number
  overallRisk: number
  scoringFactors: Record<string, number>
}

export interface RecoveryActionNexus {
  order: number
  action: string
  participatingAssets: AssetId[]
  autonomyClass: 'preapproved' | 'human_approval'
  completed: boolean
}

export interface CoordinatedRecoveryPlan {
  id: string
  name: string
  actions: RecoveryActionNexus[]
  route: RescueRoute
  estimatedEnergyWh: number
  estimatedDurationMinutes: number
  safetyScore: number
  scientificValueScore: number
  missionSuccessProbability: number
  advantages: string[]
  tradeoffs: string[]
  rejectedAlternatives: string[]
  status: 'draft' | 'awaiting_approval' | 'approved' | 'rejected' | 'alternative_requested'
  safetyValidated: boolean
}

export interface FutureInputs {
  roverSpeed: number
  solarOutput: number
  terrainResistance: number
  communicationDuration: number
  motorTemperature: number
  batteryLevel: number
  radiation: number
  safeZoneDistance: number
}

export interface FutureScenarioNexus {
  id: string
  name: string
  missionSuccessProbability: number
  remainingBattery: number
  componentFailureRisk: number
  travelTimeMinutes: number
  scientificValuePreserved: number
  communicationAvailability: number
  safetyScore: number
  mainRisks: string[]
  confidence: number
  recommended: boolean
  simulatedPrediction: true
}

export interface CommunicationState {
  earthConnected: boolean
  delaySeconds: number
  blackoutRemainingSeconds: number
  nextWindowAt: string
  permittedActions: string[]
  approvalRequiredActions: string[]
}

export interface ScienceOpportunityNexus {
  id: string
  title: string
  assetId: AssetId
  confidence: number
  scientificValue: number
  requiredEnergy: number
  timeCostMinutes: number
  missionRisk: number
  supportingData: string[]
  recommendation: string
  decision: 'pending' | 'investigate' | 'defer'
}

export interface NexusAuditEvent {
  id: string
  timestamp: string
  category: string
  action: string
  actor: string
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export interface TimelineEvent {
  id: string
  stage: number
  label: string
  detail: string
  kind: EvidenceKind
}

export interface MemoryNode {
  id: string
  type: 'asset' | 'component' | 'telemetry' | 'incident' | 'cause' | 'constraint' | 'science' | 'recommendation' | 'decision' | 'outcome'
  label: string
  x: number
  y: number
  evidenceIds: string[]
}

export interface MemoryLink {
  source: string
  target: string
  relation: string
}

export interface RiskAssessmentNexus {
  score: number
  level: NexusSeverity
  contributingFactors: string[]
  confidence: number
  recommendedResponse: string
}

export interface NexusSimulationState {
  isRunning: boolean
  speed: 1 | 2 | 5 | 10
  tick: number
  scenarioTick: number
  scenarioStage: number
  activeScenario: ScenarioName
  seed: number
}
