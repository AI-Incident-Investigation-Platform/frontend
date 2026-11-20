import { projectRunActivity, type RunActivity } from '../features/run-viewer/projectRuns'
import { paymentRcaPreparedAt, readIncidentInvestigation } from './incidentDetail'
import { demoWorkspace, paymentRun } from './investigation'

const historicalRuns: readonly RunActivity[] = [
  {
    run: {
      runId: 'RUN-1041-01', incidentId: 'INC-1041', status: 'awaiting-review',
      startedAt: '2026-10-16T13:22:00Z', currentStep: 16, totalSteps: 16,
    },
    events: [{
      eventId: 'EVT-1041-01', runId: 'RUN-1041-01', tool: 'compare_latency', status: 'completed',
      timestamp: '2026-10-16T13:24:08Z', durationMs: 3100,
      summary: 'Order processing p95 rose from 420 ms to 1.8 s while queue depth tripled.',
    }],
  },
  {
    run: {
      runId: 'RUN-1038-01', incidentId: 'INC-1038', status: 'completed',
      startedAt: '2026-10-16T09:42:00Z', currentStep: 12, totalSteps: 12,
    },
    completedAt: '2026-10-16T09:48:00Z',
    events: [{
      eventId: 'EVT-1038-01', runId: 'RUN-1038-01', tool: 'compare_memory', status: 'completed',
      timestamp: '2026-10-16T09:45:23Z', durationMs: 2760,
      summary: 'The profile worker reached its 512 MiB memory limit during an uncapped batch.',
    }],
  },
  {
    run: {
      runId: 'RUN-1036-01', incidentId: 'INC-1036', status: 'failed',
      startedAt: '2026-10-15T18:23:00Z', currentStep: 4, totalSteps: 18,
    },
    events: [{
      eventId: 'EVT-1036-01', runId: 'RUN-1036-01', tool: 'search_logs', status: 'failed',
      timestamp: '2026-10-15T18:24:30Z', durationMs: 90_000,
      summary: 'The carrier label log query timed out after 90 s.',
    }],
  },
]

export const runScenarios = [
  ['running', 'Running'],
  ['pending', 'Pending (queued)'],
  ['awaiting-review', 'Awaiting review'],
  ['completed', 'Completed'],
  ['failed', 'Failed tool call'],
  ['cancelled', 'Cancelled'],
  ['no-live', 'No live runs'],
  ['empty', 'Empty run list'],
  ['repeated', 'Repeated event / long outcome'],
] as const

type RunScenario = typeof runScenarios[number][0]

export function readRunScenario(value: string | null): RunScenario {
  return runScenarios.find(([id]) => id === value)?.[0] ?? 'running'
}

export function readDemoRuns(scenario: RunScenario) {
  const snapshotAt = scenario === 'completed' || scenario === 'awaiting-review'
    ? paymentRcaPreparedAt : demoWorkspace.snapshotAt
  if (scenario === 'empty') return { activities: [], snapshotAt }
  if (scenario === 'no-live') return { activities: historicalRuns, snapshotAt }

  const payment = readIncidentInvestigation(paymentRun.incidentId, scenario)
  if (!payment) return { activities: historicalRuns, snapshotAt }

  const events = payment.tools.filter(({ tool }) => tool === 'search_logs')
  const replay = scenario === 'repeated' ? events.map((event) => ({
    ...event,
    summary: event.summary + ' Sample checkout-20261016-eu-west-payment-service-production-shard-07-request-group-4f8ac2d1 shows HTTP 500 responses during checkout. The connection pool was at capacity and retries accumulated at the database acquisition step.',
  })) : []
  const paymentActivity = projectRunActivity({
    run: payment.run,
    events: payment.tools,
    completedAt: scenario === 'completed' ? paymentRcaPreparedAt : undefined,
  }, replay)

  return { activities: [paymentActivity, ...historicalRuns], snapshotAt }
}

export function findRecordedRun(incidentId: string, scenario: string | null) {
  if (incidentId === paymentRun.incidentId && scenario === 'repeated') {
    return readDemoRuns('repeated').activities[0]
  }
  return historicalRuns.find(({ run }) => run.incidentId === incidentId)
}
