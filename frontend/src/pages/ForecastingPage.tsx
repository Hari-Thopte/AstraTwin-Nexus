import { useAppStore } from '../store'
import { Card, Badge } from '../components/ui'
import { TrendingDown, Clock, AlertOctagon, Wrench } from 'lucide-react'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import { SEVERITY_COLORS } from '../theme'

const URGENCY_COLOR = { MONITOR: '#10b981', SCHEDULE: '#f59e0b', IMMEDIATE: '#ef4444' }

export function ForecastingPage() {
  const predictions = useAppStore((s) => s.predictions)

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Failure Forecasting</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Predictive maintenance insights from AI degradation models
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          value={predictions.filter((p) => p.urgency === 'IMMEDIATE').length}
          label="Immediate Action"
          color="#ef4444"
          icon={<AlertOctagon size={16} />}
        />
        <SummaryCard
          value={predictions.filter((p) => p.urgency === 'SCHEDULE').length}
          label="Schedule Soon"
          color="#f59e0b"
          icon={<Wrench size={16} />}
        />
        <SummaryCard
          value={predictions.filter((p) => p.urgency === 'MONITOR').length}
          label="Monitor Only"
          color="#10b981"
          icon={<TrendingDown size={16} />}
        />
      </div>

      {/* Prediction cards */}
      <div className="space-y-4">
        {predictions.map((pred) => {
          const sevColor = SEVERITY_COLORS[pred.severity]
          const urgColor = URGENCY_COLOR[pred.urgency]
          return (
            <div
              key={pred.id}
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${urgColor}30`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${urgColor}18`, color: urgColor }}
                >
                  <TrendingDown size={15} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-100">{pred.componentName}</span>
                    <Badge severity={pred.severity} size="xs">{pred.severity.toUpperCase()}</Badge>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${urgColor}18`, color: urgColor }}
                    >
                      {pred.urgency}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">{pred.failureMode}</div>

                  {/* Probability */}
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">Failure Probability</div>
                      <div className="text-2xl font-bold font-mono" style={{ color: sevColor }}>
                        {(pred.probability * 100).toFixed(0)}%
                        <span className="text-xs text-gray-600 ml-1">
                          [{(pred.confidenceInterval.lower * 100).toFixed(0)}–
                          {(pred.confidenceInterval.upper * 100).toFixed(0)}%]
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">Time to Failure</div>
                      <div className="text-xl font-bold font-mono text-gray-200">
                        {pred.timeToFailure}
                        <span className="text-xs text-gray-500 ml-1">hours</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">Predicted Date</div>
                      <div className="text-sm font-mono text-gray-300">
                        {formatDate(pred.predictedFailureDate)}
                      </div>
                    </div>
                  </div>

                  {/* Contributing factors */}
                  <div className="mb-3">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">
                      Contributing Factors
                    </div>
                    <ul className="space-y-1">
                      {pred.contributingFactors.map((f, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                          <span className="text-yellow-600 mt-0.5">›</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation */}
                  <div
                    className="text-xs px-3 py-2 rounded-md"
                    style={{ backgroundColor: `${urgColor}10`, border: `1px solid ${urgColor}25`, color: '#d1d5db' }}
                  >
                    <span className="font-semibold" style={{ color: urgColor }}>Recommendation: </span>
                    {pred.recommendedAction}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryCard({ value, label, color, icon }: {
  value: number; label: string; color: string; icon: React.ReactNode
}) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex items-center gap-3"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}
    >
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}
