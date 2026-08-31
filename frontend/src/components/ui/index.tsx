import clsx from 'clsx'
import type { SystemStatus, Severity } from '../../types'
import { STATUS_COLORS, SEVERITY_COLORS } from '../../theme'

// ── StatusDot ──────────────────────────────────────────────────────────────
interface StatusDotProps {
  status: SystemStatus
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusDot({ status, pulse = false, size = 'md' }: StatusDotProps) {
  const sizeClass = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-3 h-3' }[size]
  const color = STATUS_COLORS[status]
  return (
    <span
      className={clsx('rounded-full inline-block flex-shrink-0', sizeClass, pulse && 'animate-pulse')}
      style={{ backgroundColor: color }}
      title={status}
    />
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  status?: SystemStatus
  severity?: Severity
  variant?: 'solid' | 'outline' | 'subtle'
  size?: 'xs' | 'sm' | 'md'
}

export function Badge({ children, status, severity, variant = 'subtle', size = 'sm' }: BadgeProps) {
  const color = status
    ? STATUS_COLORS[status]
    : severity
    ? SEVERITY_COLORS[severity]
    : '#9ca3af'

  const bg =
    variant === 'solid'
      ? color
      : variant === 'outline'
      ? 'transparent'
      : `${color}22`

  const textColor = variant === 'solid' ? '#fff' : color
  const border = variant === 'outline' ? `1px solid ${color}` : undefined

  const sizeClass = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }[size]

  return (
    <span
      className={clsx('inline-flex items-center rounded font-medium leading-none', sizeClass)}
      style={{ backgroundColor: bg, color: textColor, border }}
    >
      {children}
    </span>
  )
}

// ── HealthBar ──────────────────────────────────────────────────────────────
interface HealthBarProps {
  value: number      // 0-100
  showLabel?: boolean
  height?: number
  compact?: boolean
}

function healthColor(value: number): string {
  if (value >= 80) return '#10b981'
  if (value >= 60) return '#f59e0b'
  if (value >= 40) return '#f97316'
  return '#ef4444'
}

export function HealthBar({ value, showLabel = true, height = 4, compact = false }: HealthBarProps) {
  const color = healthColor(value)
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('flex items-center gap-2', compact ? 'gap-1' : 'gap-2')}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono tabular-nums w-8 text-right" style={{ color }}>
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
  noPadding?: boolean
  glowColor?: string
}

export function Card({ children, className, title, subtitle, action, noPadding = false, glowColor }: CardProps) {
  return (
    <div
      className={clsx('rounded-lg border', !noPadding && 'p-4', className)}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: glowColor ? `0 0 30px ${glowColor}` : undefined,
      }}
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-100">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── MetricValue ────────────────────────────────────────────────────────────
interface MetricValueProps {
  label: string
  value: string | number
  unit?: string
  status?: SystemStatus
  mono?: boolean
}

export function MetricValue({ label, value, unit, status, mono = true }: MetricValueProps) {
  const color = status ? STATUS_COLORS[status] : '#f9fafb'
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div
        className={clsx('text-lg font-semibold', mono && 'font-mono tabular-nums')}
        style={{ color }}
      >
        {value}
        {unit && <span className="text-xs text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ color: '#06b6d4' }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity={0.2} />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-gray-600">{icon}</div>}
      <div className="text-gray-300 font-medium mb-1">{title}</div>
      {description && <div className="text-gray-500 text-sm max-w-xs">{description}</div>}
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('border-t', 'border-white/[0.06]', className)} />
}

// ── SectionHeader ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-100">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
