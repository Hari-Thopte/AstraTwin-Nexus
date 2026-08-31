import { useState } from 'react'
import { Card, Badge } from '../components/ui'
import { FlaskConical, Play, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

const SCENARIOS = [
  {
    id: 's1',
    name: 'Battery Failure at 50% Capacity',
    description: 'Simulate primary battery capacity dropping to 50% during critical traverse.',
    category: 'FAILURE_MODE',
    parameters: [
      { key: 'battery_capacity', label: 'Battery Capacity', value: 50, unit: '%', min: 20, max: 100 },
      { key: 'duration_hours', label: 'Failure Duration', value: 8, unit: 'h', min: 1, max: 72 },
    ],
  },
  {
    id: 's2',
    name: 'Solar Panel Dust Accumulation',
    description: 'Model impact of extreme dust storm reducing solar output by 65%.',
    category: 'ENVIRONMENT',
    parameters: [
      { key: 'dust_reduction', label: 'Output Reduction', value: 65, unit: '%', min: 10, max: 90 },
      { key: 'storm_duration', label: 'Storm Duration', value: 48, unit: 'h', min: 6, max: 168 },
    ],
  },
  {
    id: 's3',
    name: 'Communication Blackout',
    description: 'Test autonomous decision-making during 72-hour communication loss.',
    category: 'RESOURCE_CONSTRAINT',
    parameters: [
      { key: 'blackout_hours', label: 'Blackout Duration', value: 72, unit: 'h', min: 1, max: 240 },
      { key: 'autonomous_level', label: 'Autonomy Level', value: 3, unit: '(1-5)', min: 1, max: 5 },
    ],
  },
]

const CATEGORY_COLOR: Record<string, string> = {
  FAILURE_MODE: '#ef4444',
  ENVIRONMENT: '#f59e0b',
  RESOURCE_CONSTRAINT: '#8b5cf6',
  RECOVERY_TEST: '#3b82f6',
  MISSION_CHANGE: '#06b6d4',
}

export function WhatIfSimulatorPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [paramValues, setParamValues] = useState<Record<string, Record<string, number>>>({})
  const [runningId, setRunningId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { success: number; impact: string }>>({})

  function runSimulation(scenarioId: string) {
    setRunningId(scenarioId)
    setTimeout(() => {
      setRunningId(null)
      setResults((r) => ({
        ...r,
        [scenarioId]: {
          success: Math.round(55 + Math.random() * 35),
          impact: 'Mission continuity achievable with recommended power conservation protocols.',
        },
      }))
    }, 2000)
  }

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-100">What-If Simulator</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Run safe hypothetical scenarios against the digital twin without affecting the live mission
        </p>
      </div>

      <div
        className="text-xs px-3 py-2 rounded-md flex items-center gap-2"
        style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd' }}
      >
        <FlaskConical size={13} />
        All simulations run in an isolated sandbox — no commands are sent to the actual rover
      </div>

      <div className="space-y-3">
        {SCENARIOS.map((scenario) => {
          const isExpanded = expandedId === scenario.id
          const isRunning = runningId === scenario.id
          const result = results[scenario.id]
          const catColor = CATEGORY_COLOR[scenario.category] ?? '#9ca3af'

          return (
            <div
              key={scenario.id}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${catColor}18`, color: catColor }}
                >
                  <FlaskConical size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{scenario.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: `${catColor}18`, color: catColor }}
                    >
                      {scenario.category}
                    </span>
                    {result && (
                      <span className="text-[10px] font-mono text-green-400">
                        Last: {result.success}% success
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{scenario.description}</div>
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.05]">
                  <div className="pt-3 space-y-3">
                    {scenario.parameters.map((param) => {
                      const current = paramValues[scenario.id]?.[param.key] ?? param.value
                      return (
                        <div key={param.key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">{param.label}</span>
                            <span className="font-mono text-cyan-400">{current} {param.unit}</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            value={current}
                            onChange={(e) =>
                              setParamValues((prev) => ({
                                ...prev,
                                [scenario.id]: { ...prev[scenario.id], [param.key]: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-cyan-500"
                            style={{ accentColor: '#06b6d4' }}
                          />
                        </div>
                      )
                    })}

                    {result && (
                      <div
                        className="p-3 rounded-md text-xs"
                        style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        <div className="text-green-400 font-bold mb-1">
                          Mission Success Probability: {result.success}%
                        </div>
                        <div className="text-gray-400">{result.impact}</div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => runSimulation(scenario.id)}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
                        style={{
                          backgroundColor: isRunning ? 'rgba(6,182,212,0.05)' : 'rgba(6,182,212,0.15)',
                          color: '#06b6d4',
                          border: '1px solid rgba(6,182,212,0.3)',
                          opacity: isRunning ? 0.6 : 1,
                        }}
                      >
                        <Play size={11} />
                        {isRunning ? 'Running...' : 'Run Simulation'}
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setParamValues((prev) => ({ ...prev, [scenario.id]: {} }))}
                      >
                        <RotateCcw size={11} />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
