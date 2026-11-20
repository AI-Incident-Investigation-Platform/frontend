import type {
  LogEntry, MetricSnapshot, ServiceDependency, ServiceTelemetry, TelemetryTrace, TraceSpan,
} from '../entities/telemetry'
import {
  paymentIncident, paymentLogExcerpt, paymentRun, paymentService, paymentTelemetrySnapshot, paymentTimeoutAt, paymentTrace,
} from './investigation'

export const topologyServices = [
  { serviceId: 'api-gateway', health: 'healthy', errorRate: 0.8, latencyMs: 212, restarts24h: 0 },
  { serviceId: 'user-service', health: 'healthy', errorRate: 0.1, latencyMs: 124, restarts24h: 0 },
  { serviceId: 'order-service', health: 'degraded', errorRate: 1.4, latencyMs: 1400, restarts24h: 1 },
  {
    ...paymentService, errorRate: paymentTelemetrySnapshot.errorRate,
    latencyMs: paymentTelemetrySnapshot.latencyMs, restarts24h: 2,
  },
  { serviceId: 'inventory-service', health: 'healthy', errorRate: 0.2, latencyMs: 180, restarts24h: 0 },
  { serviceId: 'review-service', health: 'degraded', errorRate: 0.9, latencyMs: 490, restarts24h: 0 },
] as const satisfies readonly ServiceTelemetry[]

export const serviceDependencies = [
  { source: 'api-gateway', target: 'user-service' },
  { source: 'api-gateway', target: 'order-service' },
  { source: 'api-gateway', target: 'review-service' },
  { source: 'api-gateway', target: 'payment-service' },
  { source: 'order-service', target: 'payment-service' },
  { source: 'order-service', target: 'inventory-service' },
  { source: 'payment-service', target: 'inventory-service' },
  { source: 'payment-service', target: 'user-service' },
] as const satisfies readonly ServiceDependency[]

export const demoLogs: readonly LogEntry[] = [
  {
    logId: 'LOG-1042-01', timestamp: paymentTimeoutAt, serviceId: paymentService.serviceId,
    level: 'ERROR', message: 'PostgreSQL connection timeout', excerpt: paymentLogExcerpt, traceId: paymentTrace.traceId,
    metadata: {
      operation: 'checkout.charge', incidentId: paymentIncident.incidentId, runId: paymentRun.runId,
      traceId: paymentTrace.traceId, pool: 'active=40 idle=0 pending=18 max=40',
    },
  },
  {
    logId: 'LOG-1042-02', timestamp: '2026-10-16T14:35:08.842Z', serviceId: paymentService.serviceId,
    level: 'ERROR', message: 'Pool limit exceeded', metadata: { operation: 'postgres.acquire', limit: '40 connections' },
  },
  {
    logId: 'LOG-1042-03', timestamp: '2026-10-16T14:35:08.660Z', serviceId: 'order-service',
    level: 'WARN', message: 'Downstream payment request exceeded the latency budget',
    metadata: { operation: 'order.process', upstream: 'payment-service' },
  },
  {
    logId: 'LOG-1042-04', timestamp: '2026-10-16T14:35:07.992Z', serviceId: paymentService.serviceId,
    level: 'ERROR', message: 'Failed to acquire DB connection for checkout-20261016-eu-west-order-payment-confirmation-attempt-03-shard-07-retry-window-000000000342',
    metadata: { operation: 'postgres.acquire', duration: '1310 ms' },
  },
  {
    logId: 'LOG-1042-05', timestamp: '2026-10-16T14:35:07.226Z', serviceId: 'api-gateway',
    level: 'WARN', message: 'POST /checkout exceeded its 1200 ms budget',
    metadata: { operation: 'POST /checkout', budget: '1200 ms' },
  },
  {
    logId: 'LOG-1042-06', timestamp: '2026-10-16T14:35:06.117Z', serviceId: paymentService.serviceId,
    level: 'ERROR', message: 'Checkout returned HTTP 500 while waiting for the pool',
    metadata: { operation: 'checkout.charge', statusCode: '500' },
  },
  {
    logId: 'LOG-1042-07', timestamp: '2026-10-16T14:35:04.534Z', serviceId: 'inventory-service',
    level: 'INFO', message: 'Stock reserved for order', metadata: { operation: 'inventory.reserve' },
  },
  {
    logId: 'LOG-1042-08', timestamp: '2026-10-16T10:12:14.000Z', serviceId: paymentService.serviceId,
    level: 'INFO', message: 'Payment connection pool initialized', metadata: { capacity: '40 connections' },
  },
]

export const paymentMetrics: readonly MetricSnapshot[] = [
  { label: 'HTTP error rate', value: paymentTelemetrySnapshot.errorRate, unit: '%', max: 16, tone: 'danger' },
  { label: 'P95 latency', value: paymentTelemetrySnapshot.latencyMs / 1000, unit: 's', max: 1.8, tone: 'warning' },
  { label: 'DB pool usage', value: paymentTelemetrySnapshot.poolUsage, unit: '%', max: 100, tone: 'danger' },
  { label: 'CPU usage (host)', value: paymentTelemetrySnapshot.hostCpuUsage, unit: '%', max: 100, tone: 'success' },
]

export const canonicalTrace: TelemetryTrace = {
  ...paymentTrace,
  rootService: 'api-gateway',
  spans: [
    { spanId: 'checkout', serviceId: 'api-gateway', operation: paymentTrace.operation, status: 'error',
      startOffsetMs: 0, durationMs: paymentTrace.durationMs, detail: 'Checkout returned HTTP 500.' },
    { spanId: 'order-process', parentSpanId: 'checkout', serviceId: 'order-service', operation: 'process',
      status: 'error', startOffsetMs: 54, durationMs: 1420, detail: 'The downstream payment call exceeded its budget.' },
    { spanId: 'payment-charge', parentSpanId: 'order-process', serviceId: paymentService.serviceId, operation: 'charge',
      status: 'error', startOffsetMs: 107, durationMs: 1360, detail: 'The payment handler timed out acquiring a database connection.' },
    { spanId: 'db-acquire', parentSpanId: 'payment-charge', serviceId: 'postgres', operation: 'acquire connection',
      status: 'error', startOffsetMs: 131, durationMs: 1310, detail: 'Deadline exceeded. 40 connections active, 18 waiting.' },
    { spanId: 'inventory-reserve', parentSpanId: 'order-process', serviceId: 'inventory-service', operation: 'reserve',
      status: 'ok', startOffsetMs: 95, durationMs: 120, detail: 'Reserved stock while payment was in progress.' },
  ],
}

function traceWithRootAndChild(
  trace: Omit<TelemetryTrace, 'spans'>,
  child: Omit<TraceSpan, 'parentSpanId'>,
  detail: string,
): TelemetryTrace {
  return {
    ...trace,
    spans: [{
      spanId: 'root', serviceId: trace.rootService, operation: trace.operation, status: trace.status,
      startOffsetMs: 0, durationMs: trace.durationMs, detail,
    }, { ...child, parentSpanId: 'root' }],
  }
}

export const demoTraces: readonly TelemetryTrace[] = [
  canonicalTrace,
  traceWithRootAndChild({
    traceId: 'bc421f21e21544afb432c9bfa982bb59', incidentId: paymentIncident.incidentId,
    serviceId: paymentService.serviceId, rootService: paymentService.serviceId, operation: 'POST /charge',
    startedAt: '2026-10-16T14:35:07Z', durationMs: 1210, status: 'error',
  }, {
    spanId: 'acquire', serviceId: 'postgres', operation: 'acquire connection', status: 'error',
    startOffsetMs: 38, durationMs: 1150, detail: 'This checkout exceeded its shorter acquisition deadline.',
  }, 'The payment request returned HTTP 500 after waiting for the pool.'),
  traceWithRootAndChild({
    traceId: 'd0f4d82227cf49bc8916a76b0d83ca70', incidentId: paymentIncident.incidentId,
    serviceId: 'order-service', rootService: 'order-service', operation: 'process',
    startedAt: '2026-10-16T14:34:59Z', durationMs: 892, status: 'error',
  }, {
    spanId: 'payment-call', serviceId: paymentService.serviceId, operation: 'charge', status: 'error',
    startOffsetMs: 61, durationMs: 780, detail: 'Order processing cancelled the downstream payment call.',
  }, 'Order processing failed while waiting on payment.'),
  traceWithRootAndChild({
    traceId: 'ef32076fc04a42acb8968f83937583d0', incidentId: paymentIncident.incidentId,
    serviceId: paymentService.serviceId, rootService: 'api-gateway', operation: 'POST /checkout',
    startedAt: '2026-10-16T13:05:00Z', durationMs: 612, status: 'ok',
  }, {
    spanId: 'payment-call', serviceId: paymentService.serviceId, operation: 'charge', status: 'ok',
    startOffsetMs: 52, durationMs: 480, detail: 'The payment completed before the rollout.',
  }, 'This baseline checkout completed before the release.'),
]

const queueChecks: readonly TraceSpan[] = Array.from({ length: 20 }, (_, index): TraceSpan => ({
  spanId: 'pool-check-' + (index + 1), parentSpanId: 'db-acquire',
  serviceId: 'postgres', operation: 'pool.queue_check ' + (index + 1), status: 'ok',
  startOffsetMs: 150 + index * 60, durationMs: 12,
  detail: 'Pool diagnostic sample: 40 active connections and 18 waiting.',
}))

export const traceWithManySpans: TelemetryTrace = {
  ...canonicalTrace,
  spans: [...canonicalTrace.spans.slice(0, 4), ...queueChecks, ...canonicalTrace.spans.slice(4)],
}
