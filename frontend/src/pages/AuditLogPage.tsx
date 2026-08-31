import { useAppStore } from '../store'
import { Badge } from '../components/ui'
import { Shield, Info, AlertTriangle, XCircle } from 'lucide-react'
import { formatTimestamp } from '../utils/formatters'
import type { AuditEvent } from '../types'

const SEVERITY_ICON = {
  INFO: <Info size={13} className="text-blue-400" />,
  WARNING: <AlertTriangle size={13} className="text-yellow-400" />,
  ERROR: <XCircle size={13} className="text-red-400" />,
}

const CATEGORY_COLOR: Record<string, string> = {
  DETECTION: '#f59e0b',
  PREDICTION: '#ef4444',
  PLANNING: '#3b82f6',
  SIMULATION: '#8b5cf6',
  APPROVAL: '#06b6d4',
  OVERRIDE: '#f97316',
  SYSTEM: '#9ca3af',
  COMMUNICATION: '#10b981',
}

export function AuditLogPage() {
  const events = useAppStore((s) => s.auditEvents)

  const byCategory = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-5 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Audit Log</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable record of all AI decisions, actions, and system events
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Shield size={13} className="text-cyan-600" />
          {events.length} events logged
        </div>
      </div>

      {/* Category summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(byCategory).map(([cat, count]) => (
          <div
            key={cat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              backgroundColor: `${CATEGORY_COLOR[cat] ?? '#9ca3af'}18`,
              border: `1px solid ${CATEGORY_COLOR[cat] ?? '#9ca3af'}30`,
              color: CATEGORY_COLOR[cat] ?? '#9ca3af',
            }}
          >
            <span className="font-medium">{count}</span>
            <span className="text-gray-500">{cat}</span>
          </div>
        ))}
      </div>

      {/* Events table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="px-3 py-2 text-left text-[10px] text-gray-600 uppercase tracking-wide font-medium">Time</th>
              <th className="px-3 py-2 text-left text-[10px] text-gray-600 uppercase tracking-wide font-medium">Sev</th>
              <th className="px-3 py-2 text-left text-[10px] text-gray-600 uppercase tracking-wide font-medium">Category</th>
              <th className="px-3 py-2 text-left text-[10px] text-gray-600 uppercase tracking-wide font-medium">Action</th>
              <th className="px-3 py-2 text-left text-[10px] text-gray-600 uppercase tracking-wide font-medium">Actor</th>
              <th className="px-3 py-2 text-left text-[10px] text-gray-600 uppercase tracking-wide font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <AuditRow key={event.id} event={event} index={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditRow({ event, index }: { event: AuditEvent; index: number }) {
  const catColor = CATEGORY_COLOR[event.category] ?? '#9ca3af'
  return (
    <tr
      className="border-b hover:bg-white/[0.02] transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.04)', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
    >
      <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">
        {formatTimestamp(event.timestamp)}
      </td>
      <td className="px-3 py-2">
        {SEVERITY_ICON[event.severity]}
      </td>
      <td className="px-3 py-2">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ backgroundColor: `${catColor}18`, color: catColor }}
        >
          {event.category}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-gray-300 whitespace-nowrap">{event.action}</td>
      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
        <span
          className="text-[10px]"
          style={{ color: event.actor === 'AI_SYSTEM' ? '#06b6d4' : '#9ca3af' }}
        >
          {event.actor}
        </span>
      </td>
      <td className="px-3 py-2 text-gray-500 max-w-xs truncate">{event.details}</td>
    </tr>
  )
}
