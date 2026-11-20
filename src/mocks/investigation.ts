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

export const paymentImpact = {
  description: 'Checkout requests returned HTTP 500 after payment release v2.4.1.',
  release: 'v2.4.1',
  deployedAt: '2026-10-16T14:22:00Z',
  firstObservedAt: '2026-10-16T14:30:00Z',
  symptoms: [
    'Checkout returned HTTP 500 during payment processing.',
    'PostgreSQL connection acquisition timed out.',
    'The database connection pool reached 100% utilization.',
  ],
} as const

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
    durationMs: 1240,
    summary: 'Checkout logs contain 124 PostgreSQL connection timeout errors.',
  },
  poolUtilization: {
    eventId: 'TOOL-1042-02',
    runId: paymentRun.runId,
    tool: 'query_prometheus',
    status: 'completed',
    timestamp: '2026-10-16T14:36:48Z',
    durationMs: 820,
    summary: 'The PostgreSQL connection pool reached 100% utilization.',
  },
  checkoutTrace: {
    eventId: 'TOOL-1042-04',
    runId: paymentRun.runId,
    tool: 'get_trace',
    status: 'completed',
    timestamp: '2026-10-16T14:37:01Z',
    durationMs: 495,
    summary: 'The checkout span spent 1.31 s waiting for a database connection.',
  },
  recentRelease: {
    eventId: 'TOOL-1042-03',
    runId: paymentRun.runId,
    tool: 'get_recent_deployments',
    status: 'completed',
    timestamp: '2026-10-16T14:38:33Z',
    durationMs: 610,
    summary: 'Payment release ' + paymentImpact.release + ' preceded the increase in checkout errors.',
  },
  checkoutDiff: {
    eventId: 'TOOL-1042-05',
    runId: paymentRun.runId,
    tool: 'git_diff',
    status: 'running',
    timestamp: '2026-10-16T14:40:00Z',
    durationMs: null,
    summary: 'Comparing connection cleanup in the payment release.',
  },
} satisfies Record<string, ToolEvent>

export const paymentToolEvents: readonly ToolEvent[] = Object.values(toolEvents)

const slowCheckout: Evidence = {
  evidenceId: 'EVD-1042-TRACE',
  runId: paymentRun.runId,
  source: { kind: 'trace', traceId: paymentTrace.traceId },
  timestamp: paymentTrace.startedAt,
  summary: 'The failing checkout trace spent most of its duration acquiring a database connection.',
  excerpt: 'POST /checkout: 1480 ms\npayment-service /charge: HTTP 500\npostgres /acquire connection: 1310 ms, deadline exceeded',
}

function evidenceFromToolEvent(
  evidenceId: string,
  kind: Exclude<Evidence['source']['kind'], 'trace'>,
  event: ToolEvent,
  excerpt: string,
): Evidence {
  return {
    evidenceId,
    runId: event.runId,
    timestamp: event.timestamp,
    summary: event.summary,
    source: { kind, eventId: event.eventId },
    excerpt,
  }
}

const timeoutLogs = evidenceFromToolEvent('EVD-1042-01', 'log', toolEvents.timeoutLogs, [
  '2026-10-16T14:35:09Z ERROR payment-service checkout.charge request failed',
  'PostgreSQLAcquireTimeout: connection acquisition exceeded 1300 ms',
  '    at PostgreSQLPool.acquire (db/pool.ts:141:18)',
  '    at PaymentRepository.beginTransaction (payments/repository.ts:87:23)',
  '    at CheckoutPaymentHandler.charge (checkout/payment-handler.ts:196:14)',
  '    at CheckoutController.postCheckout (checkout/controller.ts:54:9)',
  'pool active=40 idle=0 pending=18 max=40',
  'context requestId=checkout-20261016-eu-west-order-payment-confirmation-attempt-03 traceId=' + paymentTrace.traceId,
].join('\n'))
const poolUtilization = evidenceFromToolEvent('EVD-1042-02', 'metric', toolEvents.poolUtilization,
  'payment_db_pool_utilization = 100%\npayment_db_pool_pending = 18\nprocess_cpu_utilization = 31–37% during the checkout error window')
const recentRelease = evidenceFromToolEvent('EVD-1042-03', 'deployment', toolEvents.recentRelease,
  'payment-service ' + paymentImpact.release + '\nProduction rollout completed at ' + paymentImpact.deployedAt)

export const paymentEvidence: readonly Evidence[] = [timeoutLogs, poolUtilization, slowCheckout, recentRelease]

export const paymentCodeEvidence: Evidence = {
  evidenceId: 'EVD-1042-CODE',
  runId: paymentRun.runId,
  source: { kind: 'code', eventId: toolEvents.checkoutDiff.eventId },
  timestamp: '2026-10-16T14:41:46Z',
  summary: 'The release diff shows an early error return that bypasses connection release.',
  excerpt: 'payments/repository.ts · v2.4.0 → v2.4.1\nError branch returns before the checked-out client is released.',
}

export const paymentHypotheses: readonly Hypothesis[] = [
  {
    hypothesisId: 'HYP-1042-01',
    runId: paymentRun.runId,
    title: 'PostgreSQL connection leak',
    explanation: 'Pool saturation and slow acquisition explain the checkout timeouts while CPU has headroom.',
    status: 'supported',
    evidenceIds: [timeoutLogs.evidenceId, poolUtilization.evidenceId, slowCheckout.evidenceId],
  },
  {
    hypothesisId: 'HYP-1042-03',
    runId: paymentRun.runId,
    title: 'CPU saturation',
    explanation: 'Process CPU stayed between 31% and 37% during the incident window.',
    status: 'rejected',
    evidenceIds: [poolUtilization.evidenceId],
  },
  {
    hypothesisId: 'HYP-1042-02',
    runId: paymentRun.runId,
    title: 'Deployment regression',
    explanation: 'The rollout preceded the errors. The timing makes the release a candidate for code comparison.',
    status: 'pending',
    evidenceIds: [recentRelease.evidenceId],
  },
]

export const paymentRca: RcaReport = {
  incidentId: paymentIncident.incidentId,
  runId: paymentRun.runId,
  status: 'pending',
}
