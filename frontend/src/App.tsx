import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout'

const MissionControlPage = lazy(() => import('./pages/MissionControlPage').then(module => ({ default: module.MissionControlPage })))
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage').then(module => ({ default: module.DigitalTwinPage })))
const TelemetryPage = lazy(() => import('./pages/TelemetryPage').then(module => ({ default: module.TelemetryPage })))
const IncidentIntelligencePage = lazy(() => import('./pages/IncidentIntelligencePage').then(module => ({ default: module.IncidentIntelligencePage })))
const MissionCouncilPage = lazy(() => import('./pages/MissionCouncilPage').then(module => ({ default: module.MissionCouncilPage })))
const FutureSimulatorPage = lazy(() => import('./pages/FutureSimulatorPage').then(module => ({ default: module.FutureSimulatorPage })))
const ScienceDiscoveryPage = lazy(() => import('./pages/ScienceDiscoveryPage').then(module => ({ default: module.ScienceDiscoveryPage })))
const MissionMemoryPage = lazy(() => import('./pages/MissionMemoryPage').then(module => ({ default: module.MissionMemoryPage })))
const ReportsAuditPage = lazy(() => import('./pages/ReportsAuditPage').then(module => ({ default: module.ReportsAuditPage })))

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#050810] text-xs uppercase tracking-[0.18em] text-cyan-300">Synchronizing mission intelligence…</div>}>
        <Routes>
          <Route element={<AppShell />}>
          <Route index element={<Navigate to="/mission-control" replace />} />
          <Route path="/mission-control" element={<MissionControlPage />} />
          <Route path="/digital-twin" element={<DigitalTwinPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/incidents" element={<IncidentIntelligencePage />} />
          <Route path="/mission-council" element={<MissionCouncilPage />} />
          <Route path="/future-simulator" element={<FutureSimulatorPage />} />
          <Route path="/science" element={<ScienceDiscoveryPage />} />
          <Route path="/mission-memory" element={<MissionMemoryPage />} />
          <Route path="/reports-audit" element={<ReportsAuditPage />} />
          <Route path="/anomalies" element={<Navigate to="/incidents" replace />} />
          <Route path="/forecasting" element={<Navigate to="/future-simulator" replace />} />
          <Route path="/replanning" element={<Navigate to="/mission-council" replace />} />
          <Route path="/simulator" element={<Navigate to="/future-simulator" replace />} />
          <Route path="/reports" element={<Navigate to="/reports-audit" replace />} />
          <Route path="/audit" element={<Navigate to="/reports-audit" replace />} />
          <Route path="*" element={<Navigate to="/mission-control" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
