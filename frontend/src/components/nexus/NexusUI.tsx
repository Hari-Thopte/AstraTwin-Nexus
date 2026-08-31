import { useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { AlertTriangle, Calculator, CheckCircle2, ChevronDown, Info, Radio } from 'lucide-react'
import type { EvidenceKind, NexusSeverity, NexusStatus } from '../../types/nexus'
import { NEXUS_STATUS_COLORS } from '../../utils/nexusData'
import { MISSION_CONFIG } from '../../config/mission'
import { getMethod, type SystemMethodKey } from '../../config/methods'

export function PageHeading({ title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-slate-50">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function NexusPanel({ children, className, accent, style }: { children: ReactNode; className?: string; accent?: string; style?: CSSProperties }) {
  return (
    <section
      className={clsx('nexus-panel', className)}
      style={{ ...(accent ? { borderColor: `${accent}35`, boxShadow: `inset 0 1px 0 ${accent}14` } : {}), ...style }}
    >
      {children}
    </section>
  )
}

export function StatusPill({ status, label }: { status: NexusStatus; label?: string }) {
  const color = NEXUS_STATUS_COLORS[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color, borderColor: `${color}45`, background: `${color}13` }}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', status !== 'normal' && 'animate-pulse')} style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      {label ?? status}
    </span>
  )
}

export function SeverityPill({ severity }: { severity: NexusSeverity }) {
  const map: Record<NexusSeverity, NexusStatus> = { low: 'normal', medium: 'warning', high: 'high', critical: 'critical' }
  return <StatusPill status={map[severity]} label={severity} />
}

export function MetricTile({ label, value, unit, accent = '#d8f4ff', detail, icon, methodKey, timestamp, inputs }: { label: string; value: string | number; unit?: string; accent?: string; detail?: string; icon?: ReactNode; methodKey?: SystemMethodKey; timestamp?: string; inputs?: string[] }) {
  return (
    <div className="metric-tile">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-slate-500">
        <span>{label}</span>{icon}
      </div>
      <div className="mt-2 text-2xl font-semibold font-mono tracking-tight" style={{ color: accent }}>
        {value}{unit && <span className="ml-1 text-[11px] font-medium text-slate-500">{unit}</span>}
      </div>
      {detail && <div className="mt-1 text-[11px] text-slate-500">{detail}</div>}
      {methodKey && <MethodDetails methodKey={methodKey} timestamp={timestamp} inputs={inputs} compact />}
    </div>
  )
}

export function MiniBar({ value, color = '#22d3ee', label }: { value: number; color?: string; label?: string }) {
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-[10px] text-slate-500"><span>{label}</span><span>{Math.round(value)}%</span></div>}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color, boxShadow: `0 0 10px ${color}75` }} />
      </div>
    </div>
  )
}

export function ConfidenceMeter({ confidence, completeness = 88, reliability = 94 }: { confidence: number; completeness?: number; reliability?: number }) {
  void confidence
  void completeness
  void reliability
  return (
    <div className="council-metric-stack">
      {['Confidence', 'Data completeness', 'Sensor reliability'].map(label => (
        <div key={label} className="council-metric-row"><span>{label}</span><strong>[NEEDS METHOD]</strong></div>
      ))}
      <MethodDetails methodKey="agentConfidence" compact />
    </div>
  )
}

export function EvidenceLegend() {
  const items: Array<[EvidenceKind, string, string]> = [
    ['verified_observation', 'Observation', '#38bdf8'],
    ['detected_anomaly', 'Anomaly', '#ff7a33'],
    ['inferred_cause', 'Inferred cause', '#a78bfa'],
    ['predicted_outcome', 'Prediction', '#f5b942'],
    ['recommended_action', 'Action', '#21d99a'],
  ]
  return <div className="flex flex-wrap gap-2">{items.map(([kind, label, color]) => <span key={kind} className="inline-flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-2 w-2 rounded-sm" style={{ background: color }} />{label}</span>)}</div>
}

export function MissionInformationPanel() {
  return (
    <NexusPanel className="mission-information-panel p-4">
      <div className="flex items-start gap-3">
        <Info size={17} className="mt-0.5 shrink-0 text-cyan-300" />
        <div>
          <h2 className="nexus-section-title">Mission information</h2>
          <p className="mt-2 text-sm text-slate-300">{MISSION_CONFIG.name} operates at the {MISSION_CONFIG.operatingRegion}.</p>
          <p className="mt-2 text-sm text-amber-100/80">{MISSION_CONFIG.limitation}</p>
        </div>
      </div>
    </NexusPanel>
  )
}

export function PageLimitation({ children }: { children: ReactNode }) {
  return <div className="page-limitation"><Info size={13} /><span><strong>Limitation:</strong> {children}</span></div>
}

export function SourceLabel({ children }: { children: ReactNode }) {
  return <span className="source-label">{children}</span>
}

export function MethodDetails({ methodKey, timestamp, inputs, compact = false }: { methodKey: SystemMethodKey; timestamp?: string; inputs?: string[]; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const method = getMethod(methodKey)
  const shownInputs = inputs?.length ? inputs : method.inputs
  return (
    <div className={clsx('method-details', compact && 'compact')}>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="method-details-trigger">
        <Calculator size={compact ? 10 : 12} /> How calculated <ChevronDown size={compact ? 10 : 12} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="method-details-panel">
          <div className="method-details-head"><strong>{method.capability}</strong><SourceLabel>{method.origin}</SourceLabel></div>
          <dl>
            <div><dt>Method</dt><dd>{method.method}</dd></div>
            <div><dt>Inputs</dt><dd>{shownInputs.length ? shownInputs.join('; ') : 'None documented'}</dd></div>
            <div><dt>Data source</dt><dd>{method.source}</dd></div>
            <div><dt>Last updated</dt><dd>{timestamp ? new Date(timestamp).toLocaleString() : 'Scenario load time'}</dd></div>
            <div><dt>Limitation</dt><dd>{method.limitation}</dd></div>
          </dl>
          <div className={clsx('method-status', method.status === '[NEEDS METHOD]' && 'needs-method')}>{method.status}</div>
        </div>
      )}
    </div>
  )
}

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px]', connected ? 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300' : 'border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300')}>
      <Radio size={11} /> {connected ? 'FastAPI synchronized' : 'Offline mission engine'}
    </span>
  )
}

export function ValidationBadge({ valid }: { valid: boolean }) {
  return valid ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 size={13} /> Safety validated</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-300"><AlertTriangle size={13} /> Validation required</span>
  )
}
