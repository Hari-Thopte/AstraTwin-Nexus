import { useMemo, useState } from 'react'
import { CheckCircle2, Download, FileCheck2, FileText, Filter, Gavel, Printer, RotateCw, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react'
import { MethodDetails, NexusPanel, PageHeading, PageLimitation, SourceLabel, StatusPill, ValidationBadge } from '../components/nexus/NexusUI'
import { useNexusStore } from '../store/nexusStore'
import { SYSTEM_METHODS } from '../config/methods'

export function ReportsAuditPage() {
  const [filter, setFilter] = useState('ALL')
  const mission = useNexusStore(state => state.mission)
  const assets = useNexusStore(state => state.assets)
  const incident = useNexusStore(state => state.incidents[0])
  const plan = useNexusStore(state => state.plan)
  const audit = useNexusStore(state => state.audit)
  const generateReport = useNexusStore(state => state.generateReport)
  const approve = useNexusStore(state => state.approvePlan)
  const reject = useNexusStore(state => state.rejectPlan)
  const alternative = useNexusStore(state => state.requestAlternativePlan)
  const categories = useMemo(() => ['ALL', ...Array.from(new Set(audit.map(event => event.category)))], [audit])
  const filtered = filter === 'ALL' ? audit : audit.filter(event => event.category === filter)
  const generatedCount = audit.filter(event => event.action === 'MISSION_REPORT_GENERATED').length

  const download = () => {
    const html = generateReport()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `astratwin-nexus-report-${new Date().toISOString().slice(0, 10)}.html`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const print = () => {
    const html = generateReport()
    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) return
    printWindow.opener = null
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    window.setTimeout(() => { printWindow.focus(); printWindow.print() }, 250)
  }

  return (
    <div className="nexus-page space-y-5">
      <PageHeading
        title="Reports & Audit"
        description="Export the current scenario record, inspect method status and review changes made during this browser session."
        actions={<><button className="nexus-btn-primary" onClick={download}><Download size={14} /> Export report</button><button className="nexus-btn-secondary" onClick={print}><Printer size={14} /> Print report</button></>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="metric-tile"><div className="text-[10px] uppercase text-slate-500">Audit events</div><div className="mt-2 font-mono text-2xl text-cyan-300">{audit.length}</div><div className="mt-1 text-[10px] text-slate-500">Current session</div></div>
        <div className="metric-tile"><div className="text-[10px] uppercase text-slate-500">Reports generated</div><div className="mt-2 font-mono text-2xl text-purple-300">{generatedCount}</div><div className="mt-1 text-[10px] text-slate-500">Printable HTML</div></div>
        <div className="metric-tile"><div className="text-[10px] uppercase text-slate-500">Recommendation</div><div className="mt-2 text-sm font-semibold text-slate-100">{plan?.status.replace(/_/g, ' ') ?? 'Not required'}</div><div className="mt-1 text-[10px] text-slate-500">Human-controlled state</div></div>
        <div className="metric-tile"><div className="text-[10px] uppercase text-slate-500">Evidence integrity</div><div className="mt-2 text-sm font-semibold text-slate-200">Not calculated</div><MethodDetails methodKey="evidenceIntegrity" compact /></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,.65fr)]">
        <NexusPanel className="p-4" accent="#22d3ee">
          <div className="flex items-center justify-between"><div><div className="nexus-section-title">Mission intelligence report preview</div><div className="text-[11px] text-slate-500">All required sections are populated from current mission state</div></div><FileText size={18} className="text-cyan-300" /></div>
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0a1421] p-5">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4"><div><div className="nexus-eyebrow">ASTRATWIN NEXUS</div><h2 className="mt-1 text-xl font-semibold text-slate-100">{mission.name}</h2><p className="mt-1 text-xs text-slate-500">Mission intelligence and recovery evidence package</p></div><FileCheck2 size={28} className="text-cyan-400" /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><ReportStat label="Mission health" value={`${mission.overallHealth.toFixed(0)}/100 · scenario`} /><ReportStat label="Mission success" value="Not calculated" /><ReportStat label="Assets" value={`${assets.length} · observed state`} /><ReportStat label="Incident" value={incident ? 'High · scenario' : 'None'} /></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ReportSection title="Incident timeline" ready={Boolean(incident)} detail={incident?.title ?? 'Normal operation recorded'} />
              <ReportSection title="Incident relationship assessment" ready={Boolean(incident)} detail={incident?.probableRootCause ?? 'No active incident relationship'} />
              <ReportSection title="Failure prediction" ready={false} detail="Not calculated in the frontend snapshot" />
              <ReportSection title="Mission Council findings" ready={Boolean(plan)} detail={plan?.name ?? 'Council standing by'} />
              <ReportSection title="Compared futures" ready detail="Three deterministic branches included" />
              <ReportSection title="Scientific objectives" ready detail="Discovery evidence and protected data" />
              <ReportSection title="Confidence & limitations" ready detail="Unsupported confidence is marked [NEEDS METHOD]" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><button className="nexus-btn-primary" onClick={download}><Download size={14} /> Download HTML report</button><button className="nexus-btn-secondary" onClick={print}><Printer size={14} /> Open print view</button></div>
          </div>
        </NexusPanel>

        <NexusPanel className="p-4" accent={plan?.status === 'approved' ? '#21d99a' : '#f5b942'}>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Gavel size={15} className="text-amber-300" /><div className="nexus-section-title">Human approval authority</div></div>{plan && <StatusPill status={plan.status === 'approved' ? 'normal' : plan.status === 'rejected' ? 'critical' : 'warning'} label={plan.status.replace(/_/g, ' ')} />}</div>
          {plan ? <>
            <h3 className="mt-4 text-base font-semibold text-slate-100">{plan.name}</h3><p className="mt-2 text-xs leading-5 text-slate-400">No action is executed on a real spacecraft. Approval updates only this decision-support simulation and its audit trail.</p>
            <div className="mt-4 grid grid-cols-3 gap-2"><ReportStat label="Safety" value={`${plan.safetyScore}/100 · scenario`} /><ReportStat label="Energy" value={`${plan.estimatedEnergyWh} Wh · scenario`} /><ReportStat label="Success" value="Not calculated" /></div>
            <div className="mt-4"><ValidationBadge valid={plan.safetyValidated} /></div>
            <div className="mt-4 flex flex-wrap gap-2"><button className="nexus-btn-success" onClick={() => approve()} disabled={plan.status === 'approved'}><ThumbsUp size={14} /> Approve</button><button className="nexus-btn-danger" onClick={() => reject()} disabled={plan.status === 'rejected'}><ThumbsDown size={14} /> Reject</button><button className="nexus-btn-secondary" onClick={alternative}><RotateCw size={14} /> Alternative</button></div>
          </> : <div className="mt-4 rounded-lg bg-white/[0.025] p-4 text-xs leading-5 text-slate-400">No high-risk recommendation is awaiting approval. The mission remains inside its normal operating envelope.</div>}
        </NexusPanel>
      </div>

      <NexusPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="nexus-section-title">System Methods</div><div className="text-[11px] text-slate-500">Declared capability status based on the current implementation</div></div><SourceLabel>Code audit</SourceLabel></div>
        <div className="mt-4 overflow-x-auto"><table className="nexus-table methods-table min-w-[900px]"><thead><tr><th>Capability</th><th>Method</th><th>Inputs</th><th>Output origin</th><th>Status</th><th>Data source</th><th>Limitation</th></tr></thead><tbody>{Object.values(SYSTEM_METHODS).map(method => <tr key={method.id}><td className="text-slate-200">{method.capability}</td><td>{method.method}</td><td>{method.inputs.join('; ') || 'None documented'}</td><td><SourceLabel>{method.origin}</SourceLabel></td><td>{method.status}</td><td className="font-mono text-[10px]">{method.source}</td><td className="max-w-sm text-slate-400">{method.limitation}</td></tr>)}</tbody></table></div>
      </NexusPanel>

      <NexusPanel className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-300" /><div><div className="nexus-section-title">Mission audit trail</div><div className="text-[11px] text-slate-500">Simulation changes, incidents, council actions, approvals and reports</div></div></div><label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-slate-400"><Filter size={13} /> Category<select value={filter} onChange={event => setFilter(event.target.value)} className="bg-transparent text-cyan-300 outline-none">{categories.map(category => <option key={category} value={category} className="bg-slate-900">{category}</option>)}</select></label></div>
        <div className="mt-4 overflow-x-auto"><table className="nexus-table min-w-[820px]"><thead><tr><th>Timestamp</th><th>Category</th><th>Action</th><th>Actor</th><th>Details</th><th>Severity</th></tr></thead><tbody>{filtered.map(event => <tr key={event.id}><td className="font-mono text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</td><td>{event.category}</td><td className="text-slate-200">{event.action.replace(/_/g, ' ')}</td><td>{event.actor}</td><td className="max-w-xl text-slate-400">{event.details}</td><td><StatusPill status={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'normal'} label={event.severity} /></td></tr>)}</tbody></table></div>
      </NexusPanel>
      <PageLimitation>Downloaded reports describe the current simulated browser state and are not signed or flight-certified records.</PageLimitation>
    </div>
  )
}

function ReportStat({ label, value }: { label: string; value: string }) { return <div><div className="text-[9px] uppercase text-slate-500">{label}</div><div className="mt-1 font-mono text-sm text-slate-100">{value}</div></div> }
function ReportSection({ title, ready, detail }: { title: string; ready: boolean; detail: string }) { return <div className="flex items-start gap-2 rounded-lg bg-white/[0.025] p-3">{ready ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" /> : <FileText size={13} className="mt-0.5 shrink-0 text-slate-500" />}<div><div className="text-xs text-slate-200">{title}</div><div className="mt-0.5 text-[10px] leading-4 text-slate-500">{detail}</div></div></div> }
