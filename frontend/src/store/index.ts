import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  AppState,
  Mission,
  Rover,
  Component,
  TelemetryReading,
  Anomaly,
  FailurePrediction,
  RecoveryPlan,
  AuditEvent,
  MissionReport,
  SimulationState,
  ApprovalDecision,
} from '../types'
import {
  INITIAL_MISSION,
  INITIAL_ROVER,
  INITIAL_COMPONENTS,
  INITIAL_TELEMETRY_HISTORY,
  LATEST_TELEMETRY,
  INITIAL_ANOMALIES,
  INITIAL_PREDICTIONS,
  INITIAL_RECOVERY_PLANS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_REPORTS,
  INITIAL_SIMULATION_STATE,
} from '../utils/mockData'

interface AppActions {
  setMission: (mission: Mission) => void
  setRover: (rover: Rover) => void
  setComponents: (components: Component[]) => void
  updateComponent: (id: string, update: Partial<Component>) => void
  setLatestTelemetry: (reading: TelemetryReading) => void
  pushTelemetry: (reading: TelemetryReading) => void
  setAnomalies: (anomalies: Anomaly[]) => void
  acknowledgeAnomaly: (id: string) => void
  setPredictions: (predictions: FailurePrediction[]) => void
  setRecoveryPlans: (plans: RecoveryPlan[]) => void
  decideRecoveryPlan: (id: string, decision: 'approve' | 'reject') => void
  setAuditEvents: (events: AuditEvent[]) => void
  addAuditEvent: (event: AuditEvent) => void
  setReports: (reports: MissionReport[]) => void
  setSimulation: (state: Partial<SimulationState>) => void
  setPendingApprovals: (approvals: ApprovalDecision[]) => void
  setConnected: (connected: boolean) => void
  setActiveNavItem: (item: string) => void
  tick: () => void
  reset: () => void
}

type Store = AppState & AppActions

const initialState: AppState = {
  mission: INITIAL_MISSION,
  rover: INITIAL_ROVER,
  components: INITIAL_COMPONENTS,
  latestTelemetry: LATEST_TELEMETRY,
  telemetryHistory: INITIAL_TELEMETRY_HISTORY,
  anomalies: INITIAL_ANOMALIES,
  predictions: INITIAL_PREDICTIONS,
  recoveryPlans: INITIAL_RECOVERY_PLANS,
  auditEvents: INITIAL_AUDIT_EVENTS,
  reports: INITIAL_REPORTS,
  simulation: INITIAL_SIMULATION_STATE,
  pendingApprovals: [],
  isConnected: true,
  lastUpdated: new Date().toISOString(),
  activeNavItem: '/mission-control',
}

export const useAppStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setMission: (mission) => set({ mission, lastUpdated: new Date().toISOString() }),
    setRover: (rover) => set({ rover }),
    setComponents: (components) => set({ components }),
    updateComponent: (id, update) =>
      set((s) => ({
        components: s.components.map((c) => (c.id === id ? { ...c, ...update } : c)),
      })),
    setLatestTelemetry: (reading) => set({ latestTelemetry: reading }),
    pushTelemetry: (reading) =>
      set((s) => ({
        latestTelemetry: reading,
        telemetryHistory: [...s.telemetryHistory.slice(-99), reading],
      })),
    setAnomalies: (anomalies) => set({ anomalies }),
    acknowledgeAnomaly: (id) =>
      set((s) => ({
        anomalies: s.anomalies.map((a) =>
          a.id === id ? { ...a, status: 'INVESTIGATING' as const } : a
        ),
      })),
    setPredictions: (predictions) => set({ predictions }),
    setRecoveryPlans: (plans) => set({ recoveryPlans: plans }),
    decideRecoveryPlan: (id, decision) =>
      set((s) => ({
        recoveryPlans: s.recoveryPlans.map((plan) =>
          plan.id === id
            ? decision === 'approve'
              ? { ...plan, status: 'ACTIVE' as const, approvedAt: new Date().toISOString(), approvedBy: 'MISSION_CONTROLLER' }
              : { ...plan, status: 'ABANDONED' as const }
            : plan
        ),
        lastUpdated: new Date().toISOString(),
      })),
    setAuditEvents: (events) => set({ auditEvents: events }),
    addAuditEvent: (event) =>
      set((s) => ({ auditEvents: [event, ...s.auditEvents].slice(0, 500) })),
    setReports: (reports) => set({ reports }),
    setSimulation: (update) =>
      set((s) => ({ simulation: { ...s.simulation, ...update } })),
    setPendingApprovals: (approvals) => set({ pendingApprovals: approvals }),
    setConnected: (connected) => set({ isConnected: connected }),
    setActiveNavItem: (item) => set({ activeNavItem: item }),

    tick: () => {
      const { simulation } = get()
      if (!simulation.isRunning) return
      set((s) => ({
        simulation: {
          ...s.simulation,
          currentTick: s.simulation.currentTick + 1,
          missionElapsedTime:
            s.simulation.missionElapsedTime + s.simulation.speed,
          lastTickAt: new Date().toISOString(),
        },
      }))
    },

    reset: () => set({ ...initialState, lastUpdated: new Date().toISOString() }),
  }))
)

// Derived selectors
export const selectOpenAnomalies = (s: AppState) =>
  s.anomalies.filter((a) => a.status === 'OPEN' || a.status === 'INVESTIGATING')

export const selectCriticalAnomalies = (s: AppState) =>
  s.anomalies.filter((a) => a.severity === 'critical' || a.severity === 'high')

export const selectOverallHealth = (s: AppState) =>
  s.rover?.overallHealth ?? 0

export const selectImmediatePredictions = (s: AppState) =>
  s.predictions.filter((p) => p.urgency === 'IMMEDIATE')
