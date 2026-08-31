import { useEffect } from 'react'
import {
  AlertTriangle,
  BatteryCharging,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Compass,
  FlaskConical,
  Gavel,
  LockKeyhole,
  RotateCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from 'lucide-react'
import {
  MethodDetails,
  NexusPanel,
  PageHeading,
  PageLimitation,
  SourceLabel,
  StatusPill,
} from '../components/nexus/NexusUI'
import { MissionCorridorMap } from '../components/experience/MissionCorridorMap'
import { useNexusStore } from '../store/nexusStore'
import type { AgentRole } from '../types/nexus'
import { MISSION_CONFIG } from '../config/mission'

const AGENT_META: Record<AgentRole, { label: string; color: string; icon: React.ReactNode; directive: string }> = {
  SYSTEMS_ENGINEER: { label: 'Systems Engineer', color: '#38bdf8', icon: <Wrench size={16} />, directive: 'Protect systems' },
  NAVIGATOR: { label: 'Navigator', color: '#38bdf8', icon: <Compass size={16} />, directive: 'Hold corridor' },
  ENERGY_MANAGER: { label: 'Energy Manager', color: '#f5b942', icon: <BatteryCharging size={16} />, directive: 'Conserve power' },
  SCIENCE_OFFICER: { label: 'Science Officer', color: '#38bdf8', icon: <FlaskConical size={16} />, directive: 'Defer sampling' },
  SAFETY_AUDITOR: { label: 'Safety Auditor', color: '#43d6a5', icon: <ShieldCheck size={16} />, directive: 'Verify first' },
  MISSION_DIRECTOR: { label: 'Mission Director', color: '#38bdf8', icon: <Gavel size={16} />, directive: 'Review decision' },
}

const COUNCIL_STEPS = ['Analyze', 'Propose', 'Resolve conflict', 'Safety audit', 'Synthesize', 'Human decision']

export function MissionCouncilPage() {
  const council = useNexusStore(state => state.council)
  const plan = useNexusStore(state => state.plan)
  const risk = useNexusStore(state => state.risk)
  const communication = useNexusStore(state => state.communication)
  const timestamp = useNexusStore(state => state.latestTelemetry['astra-1'].timestamp)
  const inject = useNexusStore(state => state.injectNightfallRescue)
  const approve = useNexusStore(state => state.approvePlan)
  const reject = useNexusStore(state => state.rejectPlan)
  const alternative = useNexusStore(state => state.requestAlternativePlan)
  const mode = useNexusStore(state => state.mode)
  const setMode = useNexusStore(state => state.setMode)

  useEffect(() => {
    if (!council.length || !plan) inject()
  }, [council.length, inject, plan])

  const director = council.find(item => item.role === 'MISSION_DIRECTOR')
  const specialists = council.filter(item => item.role !== 'MISSION_DIRECTOR')

  if (!council.length || !plan) {
    return (
      <div className="nexus-page space-y-5">
        <PageHeading title="Mission Council Review" description="Compare specialist findings before approving the recovery plan." />
        <NexusPanel className="flex min-h-[480px] flex-col items-center justify-center p-8 text-center">
          <BrainCircuit size={30} className="text-cyan-300" />
          <h2 className="mt-4 text-xl font-semibold text-slate-100">Council standing by</h2>
          <button className="nexus-btn-primary mt-5" onClick={inject}>Load council scenario</button>
        </NexusPanel>
      </div>
    )
  }

  const waitingForDecision = plan.status === 'awaiting_approval'
  const statusLabel = plan.status.replace(/_/g, ' ')
  const engineerView = mode === 'engineer'
  const commanderView = mode === 'commander'
  const publicView = mode === 'public'

  return (
    <div className="nexus-page council-review-page">
      <PageHeading
        title="Mission Council Review"
        description={engineerView
          ? 'Inspect specialist evidence, calculation methods, and the unresolved terrain constraint.'
          : publicView
            ? 'See why the mission team recommends a safer recovery route. This view cannot approve operational decisions.'
            : 'Compare specialist findings, verify the blocking safety evidence, and make the recovery decision.'}
        actions={<StatusPill status={plan.status === 'approved' ? 'normal' : plan.status === 'rejected' ? 'critical' : 'warning'} label={statusLabel} />}
      />

      <NexusPanel className="council-command-brief" accent="#f5b942">
        <div className="council-command-main">
          <div className="council-command-copy">
            <div className="council-command-eyebrow"><Gavel size={15} /> Mission recommendation</div>
            <h2>{plan.name}</h2>
            <p>{director?.finding}</p>
          </div>
          <div className="council-command-state">
            <span>Decision state</span>
            <strong>{waitingForDecision ? 'Verification required' : statusLabel}</strong>
            <small>{waitingForDecision ? `${MISSION_CONFIG.assets.support.name} terrain scan is still pending` : 'Decision recorded in the simulation'}</small>
          </div>
        </div>

        <div className="council-command-facts" aria-label="Recommendation facts">
          <div><span>Mission risk</span><strong className="warning-value">{risk.score.toFixed(0)} / 100</strong></div>
          <div><span>Energy budget</span><strong>{plan.estimatedEnergyWh} Wh</strong></div>
          <div><span>Route duration</span><strong>{plan.estimatedDurationMinutes} min</strong></div>
          <div><span>Safety gate</span><strong>{waitingForDecision ? 'Terrain confirmation' : plan.safetyValidated ? 'Constraints passed' : 'Review required'}</strong></div>
        </div>

        {engineerView && (
          <div className="council-role-summary engineer" aria-label="Engineering review scope">
            <Wrench size={16} />
            <div><strong>Engineering review active</strong><span>Seeded telemetry · rule-based assessments · local fallback services · terrain verification pending</span></div>
          </div>
        )}
        {publicView && (
          <div className="council-role-summary public" aria-label="Public mission summary">
            <BrainCircuit size={16} />
            <div><strong>In plain language</strong><span>The rover has enough power, but two uncertain terrain areas must be checked before the safer route can be approved.</span></div>
          </div>
        )}

        <ol className="council-progress-line" aria-label="Council review progress">
          {COUNCIL_STEPS.map((step, index) => {
            const complete = index < 5 || !waitingForDecision
            return (
              <li key={step} className={complete ? 'complete' : 'active'}>
                <span>{complete ? <CheckCircle2 size={14} /> : <Gavel size={14} />}</span>
                <strong>{step}</strong>
              </li>
            )
          })}
        </ol>

        {!publicView && <details className="council-route-plan">
          <summary>
            <span><strong>Recovery sequence</strong><small>Reduce speed → verify terrain → preserve data → approve route</small></span>
            <span>{plan.actions.length} reviewed actions <ChevronDown size={15} /></span>
          </summary>
          <div className="council-route-actions" aria-label="Recovery plan actions">
            {plan.actions.map(action => (
              <div key={action.order} className="council-action-row">
                <span className={`action-index ${action.completed ? 'done' : ''}`}>{action.completed ? '✓' : action.order}</span>
                <div>
                  <strong>{action.action}</strong>
                  <small>{action.participatingAssets.join(', ')} · {action.autonomyClass === 'preapproved' ? 'Inside autonomy envelope' : 'Human approval required'}</small>
                </div>
                {action.autonomyClass === 'human_approval' && <LockKeyhole size={14} className="council-action-lock" aria-label="Human approval required" />}
              </div>
            ))}
          </div>
        </details>}

        <div className={`council-decision-panel ${commanderView ? '' : 'read-only'}`}>
          <div className="council-decision-copy">
            <strong>{commanderView ? 'Human decision required' : engineerView ? 'Engineering review only' : 'Public view is read-only'}</strong>
            <span>{commanderView
              ? 'Approval remains a simulation-only action. Verify the terrain evidence before accepting the route.'
              : engineerView
                ? 'Inspect the supporting evidence and methods, then switch to Command view for a decision.'
                : 'Mission decisions remain with the commander; this view explains the recommendation without operational controls.'}</span>
          </div>
          <div className="council-decision-actions">
            {commanderView ? <>
              <button className="nexus-btn-success" onClick={() => approve()} disabled={plan.status === 'approved'}><ThumbsUp size={15} /> Approve</button>
              <button className="nexus-btn-danger" onClick={() => reject()} disabled={plan.status === 'rejected'}><ThumbsDown size={15} /> Reject</button>
              <button className="nexus-btn-secondary" onClick={alternative}><RotateCw size={15} /> Request alternative</button>
            </> : <button className="nexus-btn-primary" onClick={() => setMode('commander')}><Gavel size={15} /> Switch to Command view</button>}
          </div>
          <span className={commanderView && plan.safetyValidated ? 'council-constraint-status pass' : 'council-constraint-status warning'}>
            {commanderView && plan.safetyValidated ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {commanderView ? (plan.safetyValidated ? 'Configured constraints pass' : 'Constraint review required') : engineerView ? 'Decision controls locked' : 'No operational access'}
          </span>
        </div>
      </NexusPanel>

      <div className="council-workspace">
        <NexusPanel className="council-specialists-panel">
          <div className="council-section-head">
            <div><h2>{engineerView ? 'Engineering evidence' : publicView ? 'What the mission team found' : 'Specialist assessments'}</h2><p>{engineerView ? 'Technical evidence and limitations are expanded for inspection.' : publicView ? 'Short explanations from each mission specialist.' : 'Open a finding only when you need its evidence or limitation.'}</p></div>
            {!publicView && <SourceLabel>Rule-based</SourceLabel>}
          </div>
          <div className="council-specialist-list">
            {specialists.map(agent => {
              const meta = AGENT_META[agent.role]
              return (
                <article key={agent.agentId} className="council-specialist-card" style={{ '--specialist-accent': meta.color } as React.CSSProperties}>
                  <header>
                    <span className="council-specialist-icon">{meta.icon}</span>
                    <strong>{meta.label}</strong>
                    <span className="council-specialist-directive">{meta.directive}</span>
                  </header>
                  <p>{agent.finding}</p>
                  {!publicView && <details open={engineerView}>
                    <summary>Recommendation and supporting evidence <ChevronDown size={15} /></summary>
                    <div className="council-specialist-details">
                      <div><span>Recommended</span><p>{agent.proposedAction}</p></div>
                      <div><span>Evidence</span><ul>{agent.evidence.map(item => <li key={item}>{item}</li>)}</ul></div>
                      <div><span>Trade-off</span><p>{agent.tradeoff}</p></div>
                      <div><span>Limitation</span><p>{agent.limitation}</p></div>
                    </div>
                  </details>}
                </article>
              )
            })}
          </div>
          {!publicView && <div className="council-method-row">
            <span>Confidence, completeness, and reliability are not calibrated for these assessments.</span>
            <MethodDetails methodKey="agentAssessment" timestamp={timestamp} compact />
          </div>}
        </NexusPanel>

        <NexusPanel className="council-map-panel" accent="#22d3ee">
          <div className="council-section-head council-map-head">
            <div><h2>{publicView ? 'Mission route' : 'Operational mission corridor'}</h2><p>{publicView ? 'Select Earth, the Moon, or the spacecraft to learn its role in the mission.' : 'Select an object to see its route impact, communications state, and required action.'}</p></div>
            <SourceLabel>Interactive map</SourceLabel>
          </div>
          <MissionCorridorMap />
        </NexusPanel>

        <NexusPanel className="council-safety-panel" accent="#f5b942">
          <div className="council-section-head">
            <div><h2>Safety assessment</h2><p>One decision gate, with the supporting constraints grouped below.</p></div>
            <AlertTriangle size={18} className="council-warning-icon" />
          </div>

          <div className="council-risk-summary">
            <span>Mission risk</span>
            <strong>{risk.score.toFixed(0)} / 100</strong>
            <small>High risk until terrain verification is complete</small>
          </div>

          <section className="council-safety-section">
            <h3>Blocking verification</h3>
            <p>{MISSION_CONFIG.assets.support.name} must confirm the two uncertain terrain cells before route approval.</p>
            <div className="council-safety-checks">
              <div><span>Battery reserve ≥ 20%</span><strong className="pass">Pass</strong></div>
              <div><span>Motor temperature ≤ 82°C</span><strong className="pass">Pass</strong></div>
              <div><span>Terrain risk below rule limit</span><strong className="pending">Pending</strong></div>
              <div><span>Irreversible actions locked</span><strong className="pass">Pass</strong></div>
            </div>
          </section>

          <section className="council-safety-section">
            <h3>Council position</h3>
            <p>Preserve the coordinates, pause non-essential instruments, and defer physical sampling.</p>
          </section>

          <section className="council-safety-section">
            <h3>Blackout envelope</h3>
            <ul>{communication.permittedActions.map(action => <li key={action}><CheckCircle2 size={13} />{action}</li>)}</ul>
          </section>

          {!publicView && <div className="council-safety-method">
            <MethodDetails methodKey="missionRisk" timestamp={timestamp} />
          </div>}
        </NexusPanel>
      </div>

      <PageLimitation>{publicView ? 'This public view explains a simulated mission and cannot issue spacecraft commands.' : 'Agent findings are deterministic templates; their confidence, completeness, and reliability are not calibrated.'}</PageLimitation>
    </div>
  )
}
