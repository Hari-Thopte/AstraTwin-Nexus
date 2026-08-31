import { useAppStore } from '../store'
import { Card, Badge } from '../components/ui'
import { FileText, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { STATUS_COLORS } from '../theme'
import type { SystemStatus } from '../types'

const TREND_ICON = {
  UP: <TrendingUp size={12} className="text-green-400" />,
  DOWN: <TrendingDown size={12} className="text-red-400" />,
  STABLE: <Minus size={12} className="text-gray-500" />,
}

export function MissionReportsPage() {
  const reports = useAppStore((s) => s.reports)

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Mission Reports</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated sol-by-sol and milestone reports for Astra-1
          </p>
        </div>
        <span className="text-xs text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
              >
                <FileText size={14} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-100">{report.title}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                  >
                    {report.type}
                  </span>
                  <Badge
                    status={report.status === 'FINAL' ? 'NOMINAL' : 'WARNING'}
                    variant="subtle"
                    size="xs"
                  >
                    {report.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={11} />
                  {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                </div>
              </div>
            </div>

            {/* Summary */}
            <p className="text-xs text-gray-400 leading-relaxed mb-3">{report.summary}</p>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {report.metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <div className="text-[10px] text-gray-600 mb-0.5">{m.label}</div>
                  <div
                    className="text-base font-bold font-mono flex items-center justify-center gap-1"
                    style={{ color: m.status ? STATUS_COLORS[m.status] : '#f9fafb' }}
                  >
                    {m.value}{m.unit && <span className="text-xs text-gray-500">{m.unit}</span>}
                    {m.trend && TREND_ICON[m.trend]}
                  </div>
                </div>
              ))}
            </div>

            {/* Highlights & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Highlights</div>
                {report.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-gray-400 mb-1">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {h}
                  </div>
                ))}
              </div>
              {report.concerns.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Concerns</div>
                  {report.concerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-gray-400 mb-1">
                      <span className="text-yellow-500 mt-0.5">!</span>
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
