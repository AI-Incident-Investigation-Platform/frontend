import type { Evidence, Hypothesis, InvestigationRun, RcaReport, ToolEvent } from '../entities/investigation'
import {
  paymentCodeEvidence, paymentEvidence, paymentHypotheses, paymentImpact, paymentIncident,
  paymentRca, paymentRun, paymentToolEvents,
} from './investigation'

type TimelineEvent = {
  id: string
  source: 'Incident' | 'Agent' | 'Deployment' | 'User'
  timestamp: string
  title: string
  summary: string
}

export type IncidentInvestigation = {
  run: InvestigationRun
  impact: typeof paymentImpact
  tools: readonly ToolEvent[]
  evidence: readonly Evidence[]
  hypotheses: readonly Hypothesis[]
  timeline: readonly TimelineEvent[]
  rca: RcaReport
  failure?: string
}

const diffTimeout = 'The release diff query timed out after 90 s.'
export const paymentRcaPreparedAt = '2026-10-16T14:42:00Z'
const caseFindings = {
  incidentId: paymentIncident.incidentId,
  runId: paymentRun.runId,
  summary: 'The payment database pool saturated after the v2.4.1 rollout, delaying checkout requests until they timed out.',
  rootCause: 'An early return added in v2.4.1 skipped releasing the checked-out PostgreSQL connection.',
  evidenceIds: ['EVD-1042-01', 'EVD-1042-02', paymentCodeEvidence.evidenceId],
  recommendations: [
    'Release checked-out clients on the error path and verify with a pool exhaustion load test.',
    'Alert on sustained pool utilization and acquisition latency during rollout.',
  ],
  unknowns: [
    'The total number of abandoned checkouts is unconfirmed.',
    'The behavior of the same error path under low traffic still needs verification.',
  ],
} as const

function reportFor(scenario: string | null): RcaReport {
  if (scenario === 'approved' || scenario === 'rejected') {
    return {
      ...caseFindings, status: 'reviewed', reviewStatus: scenario, reviewedAt: '2026-10-16T14:47:00Z',
    }
  }
  if (scenario === 'completed' || scenario === 'awaiting-review') {
    return { ...caseFindings, status: 'ready', reviewStatus: scenario === 'completed' ? 'draft' : scenario }
  }
  return paymentRca
}

function toolActivity(status: InvestigationRun['status']): readonly ToolEvent[] {
  if (status === 'pending') return []
  if (status === 'running') return paymentToolEvents

  return paymentToolEvents.map((event): ToolEvent => {
    if (event.status !== 'running') return event
    if (status === 'failed') return { ...event, status, durationMs: 90_000, summary: diffTimeout }
    if (status === 'cancelled') return { ...event, status, summary: 'Release diff comparison stopped in the demo run.' }
    return { ...event, status: 'completed', durationMs: 106_000, summary: paymentCodeEvidence.summary }
  })
}

function timelineFor(run: InvestigationRun, tools: readonly ToolEvent[], rca: RcaReport): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: 'payment-release', source: 'Deployment', timestamp: paymentImpact.deployedAt,
      title: 'Payment release ' + paymentImpact.release, summary: 'Production rollout completed.',
    },
    {
      id: 'first-symptom', source: 'Incident', timestamp: paymentImpact.firstObservedAt,
      title: 'First symptoms', summary: 'Checkout started returning HTTP 500.',
    },
    {
      id: paymentIncident.incidentId, source: 'Incident', timestamp: paymentIncident.detectedAt,
      title: 'Incident detected', summary: paymentIncident.title,
    },
    {
      id: run.runId, source: 'Agent', timestamp: run.startedAt,
      title: run.status === 'pending' ? 'Investigation queued' : 'Investigation started', summary: run.runId,
    },
    ...tools.map((event): TimelineEvent => ({
      id: event.eventId, source: 'Agent', timestamp: event.timestamp, title: event.tool, summary: event.summary,
    })),
  ]
  if (run.status === 'cancelled') {
    events.push({
      id: 'cancel-run', source: 'User', timestamp: '2026-10-16T14:41:00Z',
      title: 'Run cancelled', summary: 'A demo operator stopped the investigation.',
    })
  }
  if (rca.status !== 'pending') {
    events.push({
      id: 'rca-ready', source: 'Agent', timestamp: paymentRcaPreparedAt,
      title: 'RCA prepared', summary: 'Findings are available for human review.',
    })
  }
  if (rca.status === 'reviewed') {
    events.push({
      id: 'human-review', source: 'User', timestamp: rca.reviewedAt,
      title: 'Human review completed', summary: 'Demo decision: ' + rca.reviewStatus + '.',
    })
  }
  return events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
}

export function readIncidentInvestigation(incidentId: string, scenario: string | null): IncidentInvestigation | undefined {
  if (incidentId !== paymentRun.incidentId) return undefined

  const rca = reportFor(scenario)
  let status: InvestigationRun['status'] = 'running'
  if (scenario === 'pending' || scenario === 'failed' || scenario === 'cancelled') status = scenario
  if (rca.status !== 'pending') {
    status = rca.reviewStatus === 'awaiting-review' ? 'awaiting-review' : 'completed'
  }
  let currentStep = paymentRun.currentStep
  if (status === 'pending') currentStep = 0
  if (rca.status !== 'pending') currentStep = paymentRun.totalSteps
  const run = { ...paymentRun, status, currentStep }
  const tools = [...toolActivity(status)].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
  const evidence = rca.status === 'pending' ? paymentEvidence : [...paymentEvidence, paymentCodeEvidence]

  const showEvidence = status !== 'pending' && scenario !== 'no-evidence'

  return {
    run,
    impact: paymentImpact,
    tools,
    evidence: showEvidence ? evidence : [],
    hypotheses: showEvidence ? paymentHypotheses : [],
    timeline: timelineFor(run, tools, rca),
    rca,
    failure: status === 'failed' ? diffTimeout : undefined,
  }
}
