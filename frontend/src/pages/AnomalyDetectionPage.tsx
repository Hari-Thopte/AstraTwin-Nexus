import { useAppStore } from '../store'
import { Card, Badge, StatusDot, SectionHeader } from '../components/ui'
import { AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react'
import { formatRelativeTime, formatTimestamp } from '../utils/formatters'
import { SEVERITY_COLORS } from '../theme'
import type { Anomaly } from '../types'

const STATUS_ORDER = { OPEN: 0, INVESTIGATING: 1, MITIGATED: 2, RESOLVED: 3, DISMISSED: 4 }

export function AnomalyDetectionPage() {
  const anomalies = useAppStore((s) => s.anomalies)
  const acknowledge = useAppStore((s) => s.acknowledgeAnomaly)

  const sorted = [...anomalies].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  const open = anomalies.filter((a) => a.status === 'OPEN').length
  const investigating = anomalies.filter((a) => a.status === 'INVESTIGATING').length
  const resolved = anomalies.filter((a) => a.status === 'RESOLVED' || a.status === 'DISMISSED').length

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Anomaly Detection</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          AI-detected deviations from nominal operating parameters
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={open} label="Open" color="#ef4444" />
        <StatCard value={investigating} label="Investigating" color="#f59e0b" />
        <StatCard value={resolved} label="Resolved" color="#10b981" />
      </div>

      {/* Anomaly list */}
      <div className="space-y-3">
        {sorted.map((anomaly) => (
          <AnomalyCard key={anomaly.id} anomaly={anomaly} onAcknowledge={acknowledge} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-center"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)` }}
    >
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function AnomalyCard({ anomaly, onAcknowledge }: { anomaly: Anomaly; onAcknowledge: (id: string) => void }) {
  const sevColor = SEVERITY_COLORS[anomaly.severity]
  const isActive = anomaly.status === 'OPEN' || anomaly.status === 'INVESTIGATING'

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? sevColor + '30' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${sevColor}18`, color: sevColor }}
        >
          <AlertTriangle size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-100">{anomaly.title}</span>
            <Badge severity={anomaly.severity} size="xs">{anomaly.severity.toUpperCase()}</Badge>
            <Badge
              variant="outline"
              status={anomaly.status === 'RESOLVED' ? 'NOMINAL' : anomaly.status === 'OPEN' ? 'CRITICAL' : 'WARNING'}
              size="xs"
            >
              {anomaly.status}
            </Badge>
          </div>
          <div className="text-xs text-cyan-500/70 mb-1.5">{anomaly.componentName}</div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">{anomaly.description}</p>

          {/* Suggested actions */}
          <div className="mb-2">
            <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">
              Suggested Actions
            </div>
            <ul className="space-y-1">
              {anomaly.suggestedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                  <span className="text-cyan-600 mt-0.5">›</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock size={11} />
              {formatTimestamp(anomaly.detectedAt)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Eye size={11} />
              Confidence: {(anomaly.confidence * 100).toFixed(0)}%
            </div>
            {anomaly.status === 'OPEN' && (
              <button
                onClick={() => onAcknowledge(anomaly.id)}
                className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded"
                style={{
                  backgroundColor: 'rgba(6,182,212,0.12)',
                  color: '#06b6d4',
                  border: '1px solid rgba(6,182,212,0.25)',
                }}
              >
                <CheckCircle size={11} />
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
