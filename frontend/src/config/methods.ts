export type MethodStatus = 'Implemented' | 'Rule-based' | 'Simulated' | 'Static demo' | 'Not implemented' | '[NEEDS METHOD]'
export type ValueOrigin = 'Calculated' | 'Simulated' | 'Scenario value' | 'Not calculated'

export interface MethodDefinition {
  id: string
  capability: string
  method: string
  inputs: string[]
  output: string
  status: MethodStatus
  origin: ValueOrigin
  source: string
  limitation: string
}

export const SYSTEM_METHODS = {
  telemetry: {
    id: 'telemetry', capability: 'Telemetry', method: 'Seeded sine variation plus bounded stage offsets',
    inputs: ['Simulation seed', 'Sample index', 'Scenario stage', 'Mission elapsed time'], output: 'Asset sensor readings',
    status: 'Simulated', origin: 'Simulated', source: 'frontend/src/utils/nexusData.ts:createTelemetry',
    limitation: 'Generated readings are not live spacecraft data.',
  },
  missionHealth: {
    id: 'mission-health', capability: 'Mission health', method: 'Stored scenario value in the fixed frontend snapshot',
    inputs: ['Scenario state'], output: 'Mission health value', status: 'Static demo', origin: 'Scenario value',
    source: 'frontend/src/utils/nexusData.ts:INITIAL_NEXUS_MISSION', limitation: 'The initial value is not calculated from current component health.',
  },
  missionSuccess: {
    id: 'mission-success', capability: 'Mission success', method: '[NEEDS METHOD]', inputs: ['Scenario state'], output: 'Mission success value',
    status: '[NEEDS METHOD]', origin: 'Not calculated', source: 'Frontend scenario state', limitation: 'No calibrated probability model supports the displayed mission-level value.',
  },
  missionRisk: {
    id: 'mission-risk', capability: 'Mission risk', method: 'Weighted deterministic formula',
    inputs: ['Scenario stage', 'Wheel resistance', 'Motor temperature', 'Battery reserve', 'Earth-link state'], output: 'Risk score from 0 to 100',
    status: 'Rule-based', origin: 'Calculated', source: 'frontend/src/utils/nexusData.ts:calculateNexusRisk',
    limitation: 'Weights are prototype policy values, not flight-qualified risk calibration.',
  },
  assetEnergy: {
    id: 'asset-energy', capability: 'Asset energy', method: 'Arithmetic mean of the three current energy readings',
    inputs: ['Astra-1 battery', 'Nova battery', 'Selene available energy'], output: 'Mean available energy',
    status: 'Implemented', origin: 'Calculated', source: 'frontend/src/pages/MissionControlPage.tsx',
    limitation: 'The mean does not represent interchangeable energy between assets.',
  },
  componentHealth: {
    id: 'component-health', capability: 'Component health', method: 'Deterministic penalty rules with clamping',
    inputs: ['Wheel resistance', 'Vibration', 'Motor temperature', 'Battery reserve', 'Solar output'], output: 'Component health from 0 to 100',
    status: 'Rule-based', origin: 'Calculated', source: 'frontend/src/utils/nexusData.ts:createAssets',
    limitation: 'Health rules are demonstration thresholds, not a validated degradation model.',
  },
  anomalyDetection: {
    id: 'anomaly-detection', capability: 'Anomaly detection', method: 'Five threshold checks, a three-hit cross-sensor rule and Isolation Forest',
    inputs: ['Wheel resistance', 'Wheel vibration', 'Motor temperature', 'Battery discharge', 'Solar output'], output: 'Incident flag and backend confidence',
    status: 'Implemented', origin: 'Calculated', source: 'backend/app/services/anomaly_detector.py',
    limitation: 'The local frontend incident uses fixed demo confidence until backend incident hydration is enabled.',
  },
  incidentConfidence: {
    id: 'incident-confidence', capability: 'Frontend incident confidence', method: '[NEEDS METHOD]', inputs: ['Fixed scenario fixture'], output: 'Confidence',
    status: '[NEEDS METHOD]', origin: 'Not calculated', source: 'frontend/src/utils/nexusData.ts:createIncident',
    limitation: 'The frontend value is hardcoded and is not the backend Isolation Forest result.',
  },
  dataQuality: {
    id: 'data-quality', capability: 'Data quality', method: 'Seeded missing-reading and outlier penalties',
    inputs: ['Expected sensor count', 'Missing-reading count', 'Outlier count'], output: 'Data-quality ratio',
    status: 'Simulated', origin: 'Calculated', source: 'frontend/src/utils/nexusData.ts:createTelemetry',
    limitation: 'Quality describes the generated dataset, not physical sensor calibration.',
  },
  failurePrediction: {
    id: 'failure-prediction', capability: 'Failure prediction', method: 'Deterministic stress formula and recent linear trends',
    inputs: ['Motor temperature', 'Vibration', 'Wheel resistance', 'Telemetry history length'], output: 'Failure estimate and time to risk',
    status: 'Rule-based', origin: 'Calculated', source: 'backend/app/services/failure_forecaster.py',
    limitation: 'The estimate is not trained on lunar failure outcomes.',
  },
  routePlanning: {
    id: 'route-planning', capability: 'Route planning', method: 'A* over a 12 × 8 cost grid',
    inputs: ['Distance', 'Terrain', 'Sunlight', 'Communication', 'Component stress', 'Science value'], output: 'Route and safety score',
    status: 'Implemented', origin: 'Calculated', source: 'backend/app/services/route_planner.py',
    limitation: 'The frontend fallback route remains a static scenario fixture when backend route data is unavailable.',
  },
  agentAssessment: {
    id: 'agent-assessment', capability: 'Agent assessment', method: 'Role-specific deterministic templates over incident, risk and route evidence',
    inputs: ['Incident evidence', 'Mission risk', 'Route result'], output: 'Finding and recommendation',
    status: 'Rule-based', origin: 'Calculated', source: 'backend/app/services/agent_council.py',
    limitation: 'Agent confidence, completeness and reliability lack separate calculation methods.',
  },
  agentConfidence: {
    id: 'agent-confidence', capability: 'Agent confidence', method: '[NEEDS METHOD]', inputs: ['No documented calibration inputs'], output: 'Confidence',
    status: '[NEEDS METHOD]', origin: 'Not calculated', source: 'Frontend and backend council fixtures',
    limitation: 'The current values are authored constants, not calibrated confidence estimates.',
  },
  futureSimulation: {
    id: 'future-simulation', capability: 'Future comparison', method: 'Deterministic weighted scenario formulas',
    inputs: ['Speed', 'Solar output', 'Terrain resistance', 'Blackout duration', 'Motor temperature', 'Battery', 'Safe-zone distance'], output: 'Three comparable outcome branches',
    status: 'Simulated', origin: 'Calculated', source: 'frontend/src/utils/nexusData.ts:compareNexusFutures',
    limitation: 'Outputs are sensitivity estimates, not statistically calibrated probabilities.',
  },
  scienceScore: {
    id: 'science-score', capability: 'Science value review', method: '0.48 × value + 0.28 × confidence − 0.18 × risk − 0.06 × energy',
    inputs: ['Scenario science value', 'Scenario confidence', 'Mission risk', 'Required energy'], output: 'Opportunity score',
    status: 'Rule-based', origin: 'Calculated', source: 'frontend/src/pages/ScienceDiscoveryPage.tsx',
    limitation: 'Input values are scenario fixtures and require instrument confirmation.',
  },
  groundedExplanation: {
    id: 'grounded-explanation', capability: 'Grounded explanation', method: 'Deterministic evidence template with an optional watsonx.ai wording pass when credentials are configured',
    inputs: ['Incident record', 'Mission risk', 'Mission Director assessment'], output: 'Evidence-bounded natural-language explanation',
    status: 'Implemented', origin: 'Calculated', source: 'backend/app/services/watsonx_provider.py',
    limitation: 'The provider changes wording only; it does not calculate risk, routes or approvals.',
  },
  evidenceIntegrity: {
    id: 'evidence-integrity', capability: 'Evidence integrity', method: '[NEEDS METHOD]', inputs: [], output: 'Integrity value',
    status: 'Not implemented', origin: 'Not calculated', source: 'No implementation', limitation: 'No integrity score is currently computed.',
  },
} satisfies Record<string, MethodDefinition>

export type SystemMethodKey = keyof typeof SYSTEM_METHODS

export function getMethod(key: SystemMethodKey): MethodDefinition {
  return SYSTEM_METHODS[key]
}
