import { Card, Badge } from '../components/ui'
import { Brain, BarChart2, ChevronRight } from 'lucide-react'

const EXPLANATIONS = [
  {
    id: 'xai-001',
    type: 'ANOMALY_DETECTION',
    title: 'Battery Self-Discharge Anomaly Detection',
    summary:
      'Isolation Forest algorithm flagged anomalous self-discharge rate in Primary Battery Array. ' +
      'Model confidence: 87%.',
    reasoning: [
      'Discharge rate 14% faster than thermal model prediction for T=-12°C',
      'Impedance growth in cell group C3 consistent with SEI thickening',
      'Pattern matches 3 historical Li-ion degradation cases in training data',
    ],
    features: [
      { feature: 'Self-discharge rate', importance: 0.82, direction: 'POSITIVE', value: '+14% vs baseline' },
      { feature: 'Cell C3 impedance', importance: 0.61, direction: 'POSITIVE', value: '18.4 mΩ (+23%)' },
      { feature: 'Average temperature', importance: 0.44, direction: 'POSITIVE', value: '-12.1°C' },
      { feature: 'Cycle count', importance: 0.38, direction: 'POSITIVE', value: '1847 cycles' },
    ],
    confidence: 0.87,
    alternatives: [
      { description: 'Temperature sensor drift', score: 0.22, reason: 'Excluded — 3 redundant sensors agree' },
      { description: 'Measurement noise', score: 0.11, reason: 'Excluded — 18-reading sustained anomaly' },
    ],
    limitations: [
      'Model trained on terrestrial Li-ion data; lunar environment may differ',
      'SEI growth diagnosis requires in-situ electrochemical impedance spectroscopy',
    ],
  },
  {
    id: 'xai-002',
    type: 'FAILURE_PREDICTION',
    title: 'Drill Bit Failure Prediction',
    summary:
      'Gradient boosting regressor predicts 55% probability of drill bit fracture within 168 hours. ' +
      'Model confidence: 92%.',
    reasoning: [
      '47 Hz resonance exceeds structural damping model envelope by 2.3σ',
      'Bit operated 94h vs 120h rated inspection interval',
      'Torque signature indicates harder sub-surface material than expected',
    ],
    features: [
      { feature: 'Vibration amplitude (47Hz)', importance: 0.91, direction: 'POSITIVE', value: '2.3σ above nominal' },
      { feature: 'Hours operated', importance: 0.67, direction: 'POSITIVE', value: '94 / 120h rated' },
      { feature: 'Drilling torque', importance: 0.55, direction: 'POSITIVE', value: '+18% above basalt profile' },
      { feature: 'Previous drill cycles', importance: 0.29, direction: 'POSITIVE', value: '3 completed samples' },
    ],
    confidence: 0.92,
    alternatives: [
      { description: 'Spindle bearing wear', score: 0.41, reason: 'Possible — included in failure mode' },
      { description: 'Sensor vibration pickup', score: 0.15, reason: 'Excluded — cross-checked with IMU' },
    ],
    limitations: [
      'Training data limited to terrestrial vacuum chamber tests',
      'Actual lunar regolith composition at depth is unknown',
    ],
  },
]

const TYPE_COLOR: Record<string, string> = {
  ANOMALY_DETECTION: '#f59e0b',
  FAILURE_PREDICTION: '#ef4444',
  PLAN_RECOMMENDATION: '#3b82f6',
  ROUTE_SELECTION: '#10b981',
}

export function ExplainabilityPage() {
  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Explainable AI</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Transparent reasoning behind every AI decision — mission controllers can inspect and verify
        </p>
      </div>

      <div className="space-y-5">
        {EXPLANATIONS.map((exp) => {
          const typeColor = TYPE_COLOR[exp.type] ?? '#9ca3af'
          return (
            <div
              key={exp.id}
              className="rounded-lg p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Header */}
              <div className="flex items-start gap-2 mb-3">
                <Brain size={15} className="mt-0.5 flex-shrink-0" style={{ color: typeColor }} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-100">{exp.title}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
                    >
                      {exp.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{exp.summary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-gray-600">Confidence</div>
                  <div className="text-lg font-bold font-mono" style={{ color: typeColor }}>
                    {(exp.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Reasoning Chain</div>
                {exp.reasoning.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <span className="text-[10px] text-gray-600 mt-0.5">{i + 1}.</span>
                    <span className="text-xs text-gray-300">{r}</span>
                  </div>
                ))}
              </div>

              {/* Feature importance */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-2">Feature Importance</div>
                <div className="space-y-2">
                  {exp.features.map((f) => (
                    <div key={f.feature} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-48 truncate">{f.feature}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${f.importance * 100}%`, backgroundColor: typeColor }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-500 w-8">{(f.importance * 100).toFixed(0)}%</span>
                      <span className="text-xs text-gray-600 w-32 truncate text-right">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternatives & Limitations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Alternatives Considered</div>
                  {exp.alternatives.map((a, i) => (
                    <div key={i} className="text-xs text-gray-500 mb-1">
                      <span className="text-gray-400">{a.description}</span>
                      <span className="text-gray-600"> — {a.reason}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Model Limitations</div>
                  {exp.limitations.map((l, i) => (
                    <div key={i} className="text-xs text-gray-500 mb-1 flex items-start gap-1">
                      <span className="text-yellow-700 mt-0.5">⚠</span>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
