// Design system constants — mirrors CSS variables and Tailwind config

export const COLORS = {
  bg: {
    primary: '#0a0e1a',
    secondary: '#0d1224',
    tertiary: '#111827',
    elevated: '#1a2035',
  },
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.15)',
    active: 'rgba(6, 182, 212, 0.4)',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },
  accent: {
    cyan: '#06b6d4',
    blue: '#3b82f6',
    purple: '#8b5cf6',
  },
  status: {
    nominal: '#10b981',
    warning: '#f59e0b',
    degraded: '#f97316',
    critical: '#ef4444',
    offline: '#6b7280',
  },
} as const

export const STATUS_COLORS = {
  NOMINAL: COLORS.status.nominal,
  WARNING: COLORS.status.warning,
  DEGRADED: COLORS.status.degraded,
  CRITICAL: COLORS.status.critical,
  OFFLINE: COLORS.status.offline,
} as const

export const STATUS_BG = {
  NOMINAL: 'rgba(16, 185, 129, 0.12)',
  WARNING: 'rgba(245, 158, 11, 0.12)',
  DEGRADED: 'rgba(249, 115, 22, 0.12)',
  CRITICAL: 'rgba(239, 68, 68, 0.12)',
  OFFLINE: 'rgba(107, 114, 128, 0.12)',
} as const

export const SEVERITY_COLORS = {
  low: COLORS.status.nominal,
  medium: COLORS.status.warning,
  high: COLORS.status.degraded,
  critical: COLORS.status.critical,
} as const

export const RECHARTS_THEME = {
  grid: 'rgba(255,255,255,0.05)',
  axis: '#6b7280',
  tooltip: {
    bg: '#1a2035',
    border: 'rgba(255,255,255,0.1)',
    text: '#f9fafb',
  },
} as const

export const LAYOUT = {
  sidebarWidth: 240,
  topbarHeight: 52,
  statusbarHeight: 28,
} as const
