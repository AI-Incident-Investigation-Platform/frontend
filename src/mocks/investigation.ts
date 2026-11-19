import type {
  Evidence, Hypothesis, Incident, InvestigationRun, RcaReport, Service, ToolEvent, Trace,
} from '../entities/investigation'

export const demoWorkspace = {
  name: 'ACME',
  project: 'Platform',
  environment: 'Production',
  snapshotAt: '2026-10-16T14:40:00Z',
} as const

export const paymentService: Service = {
  serviceId: 'payment-service',
  health: 'critical',
}

export const paymentIncident: Incident = {
  incidentId: 'INC-1042',
  serviceId: paymentService.serviceId,
  title: 'Checkout HTTP 500 errors after payment deployment',
  severity: 'critical',
  status: 'investigating',
  detectedAt: '2026-10-16T14:35:00Z',
}

export const paymentRun: InvestigationRun = {
  runId: 'RUN-1042-01',
  incidentId: paymentIncident.incidentId,
  status: 'running',
  startedAt: '2026-10-16T14:36:00Z',
  currentStep: 12,
  totalSteps: 20,
}

export const paymentTrace: Trace = {
  traceId: 'af1233ef0f154e55a2d32c7fb8624010',
  incidentId: paymentIncident.incidentId,
  serviceId: paymentService.serviceId,
  operation: 'POST /checkout',
  startedAt: '2026-10-16T14:35:08Z',
  durationMs: 1480,
  status: 'error',
}

const toolEvents = {
  timeoutLogs: {
    eventId: 'TOOL-1042-01',
    runId: paymentRun.runId,
    tool: 'search_logs',
    status: 'completed',
    timestamp: '2026-10-16T14:36:22Z',
    summary: 'Checkout logs contain PostgreSQL connection timeouts.',
  },
  poolUtilization: {
    eventId: 'TOOL-1042-02',
    runId: paymentRun.runId,
    tool: 'query_prometheus',
    status: 'completed',
    timestamp: '2026-10-16T14:36:48Z',
    summary: 'The PostgreSQL connection pool reached 100% utilization.',
  },
  recentRelease: {
    eventId: 'TOOL-1042-03',
    runId: paymentRun.runId,
    tool: 'get_recent_deployments',
    status: 'completed',
    timestamp: '2026-10-16T14:38:33Z',
    summary: 'Payment release v2.4.1 preceded the increase in checkout errors.',
  },
} satisfies Record<string, ToolEvent>

export const paymentToolEvents: readonly ToolEvent[] = Object.values(toolEvents)

const slowCheckout: Evidence = {
  evidenceId: 'EVD-1042-TRACE',
  runId: paymentRun.runId,
  source: { kind: 'trace', traceId: paymentTrace.traceId },
  timestamp: paymentTrace.startedAt,
  summary: 'The failing checkout trace spent most of its duration acquiring a database connection.',
}

function evidenceFromToolEvent(evidenceId: string, event: ToolEvent): Evidence {
  return {
    evidenceId,
    runId: event.runId,
    timestamp: event.timestamp,
    summary: event.summary,
    source: { kind: 'tool-event', eventId: event.eventId },
  }
}

const timeoutLogs = evidenceFromToolEvent('EVD-1042-01', toolEvents.timeoutLogs)
const poolUtilization = evidenceFromToolEvent('EVD-1042-02', toolEvents.poolUtilization)
const recentRelease = evidenceFromToolEvent('EVD-1042-03', toolEvents.recentRelease)

export const paymentEvidence: readonly Evidence[] = [slowCheckout, timeoutLogs, poolUtilization, recentRelease]

export const paymentHypotheses: readonly Hypothesis[] = [
  {
    hypothesisId: 'HYP-1042-01',
    runId: paymentRun.runId,
    title: 'PostgreSQL connection leak',
    status: 'supported',
    evidenceIds: [timeoutLogs.evidenceId, poolUtilization.evidenceId, slowCheckout.evidenceId],
  },
  {
    hypothesisId: 'HYP-1042-02',
    runId: paymentRun.runId,
    title: 'Deployment regression',
    status: 'pending',
    evidenceIds: [recentRelease.evidenceId],
  },
]

export const paymentRca: RcaReport = {
  incidentId: paymentIncident.incidentId,
  runId: paymentRun.runId,
  status: 'pending',
}
