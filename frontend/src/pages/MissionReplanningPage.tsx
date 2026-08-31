import { useAppStore } from '../store'
import { Card, Badge, SectionHeader } from '../components/ui'
import { Map, CheckCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react'
import { formatRelativeTime } from '../utils/formatters'

export function MissionReplanningPage() {
  const plans = useAppStore((s) => s.recoveryPlans)
  const anomalies = useAppStore((s) => s.anomalies)
  const decidePlan = useAppStore((s) => s.decideRecoveryPlan)

  const active = plans.filter((p) => p.status === 'ACTIVE')
  const ready = plans.filter((p) => p.status === 'READY')

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Mission Replanning</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          AI-generated recovery plans and mission adaptation strategies
        </p>
      </div>

      {/* Plan summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Plans', value: active.length, color: '#3b82f6' },
          { label: 'Ready for Approval', value: ready.length, color: '#f59e0b' },
          { label: 'Total Plans', value: plans.length, color: '#8b5cf6' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg px-4 py-3 text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}
          >
            <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const statusColor = plan.status === 'ACTIVE' ? '#3b82f6' : plan.status === 'READY' ? '#f59e0b' : '#10b981'
          const triggerAnomaly = anomalies.find((a) => a.id === plan.trigger)

          return (
            <div
              key={plan.id}
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${statusColor}25`,
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${statusColor}18`, color: statusColor }}
                >
                  <Map size={15} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-100">{plan.title}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${statusColor}18`, color: statusColor }}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{plan.description}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Risk Reduction: </span>
                  <span className="text-green-400 font-mono font-bold">{plan.riskReduction}%</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Duration: </span>
                  <span className="text-gray-200 font-mono">{plan.estimatedDuration}h</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Power: </span>
                  <span className="font-mono" style={{ color: plan.powerCost < 0 ? '#10b981' : '#f97316' }}>
                    {plan.powerCost > 0 ? '+' : ''}{plan.powerCost} Wh
                  </span>
                </div>
                {triggerAnomaly && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={11} className="text-yellow-500" />
                    <span className="text-xs text-gray-500">Triggered by: </span>
                    <span className="text-xs text-yellow-400">{triggerAnomaly.title}</span>
                  </div>
                )}
              </div>

              {/* Steps */}
              <div>
                <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-2">
                  Recovery Steps ({plan.steps.length})
                </div>
                <div className="space-y-1.5">
                  {plan.steps.map((step) => (
                    <div key={step.order} className="flex items-start gap-2">
                      <span
                        className="text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}
                      >
                        {step.order}
                      </span>
                      <div className="flex-1">
                        <span className="text-xs text-gray-300">{step.action}</span>
                        <span className="text-[10px] text-gray-600 ml-2">
                          {step.duration} min · {step.automated ? 'Auto' : 'Manual'}
                          {step.requiresApproval && ' · Requires approval'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {plan.status === 'READY' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => decidePlan(plan.id, 'approve')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
                    style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    <CheckCircle size={12} />
                    Approve Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => decidePlan(plan.id, 'reject')}
                    className="text-xs px-3 py-1.5 rounded"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
