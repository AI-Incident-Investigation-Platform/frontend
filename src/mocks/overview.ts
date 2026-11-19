import type { Incident, Service, Severity } from '../entities/investigation'
import { paymentIncident, paymentRun, paymentService } from './investigation'

type ServiceSignal =
  | { kind: 'error-rate'; percent: number }
  | { kind: 'latency'; milliseconds: number }
  | { kind: 'consumer-lag'; messages: number }

export type AffectedService = Service & { severity: Severity; signal: ServiceSignal }

const affectedServices: readonly AffectedService[] = [
  { ...paymentService, severity: 'critical', signal: { kind: 'error-rate', percent: 12.8 } },
  {
    serviceId: 'order-service', health: 'degraded', severity: 'high',
    signal: { kind: 'latency', milliseconds: 1400 },
  },
  {
    serviceId: 'review-service', health: 'degraded', severity: 'high',
    signal: { kind: 'consumer-lag', messages: 1200 },
  },
]

const healthyServiceIds = [
  'api-gateway', 'user-service', 'inventory-service', 'auth-service', 'catalog-service',
  'cart-service', 'notification-service', 'shipping-service', 'search-service',
  'pricing-service', 'fraud-service', 'invoice-service', 'returns-service',
  'profile-service', 'recommendation-service', 'email-service', 'warehouse-service',
]

export const demoServices: readonly Service[] = [
  ...affectedServices,
  ...healthyServiceIds.map((serviceId): Service => ({ serviceId, health: 'healthy' })),
]

export const demoIncidents: readonly Incident[] = [
  paymentIncident,
  {
    incidentId: 'INC-1041', serviceId: 'order-service', title: 'Order processing p95 latency increased',
    severity: 'high', status: 'awaiting-review', detectedAt: '2026-10-16T13:20:00Z',
  },
  {
    incidentId: 'INC-1040', serviceId: 'inventory-service', title: 'Inventory worker pool exhausted',
    severity: 'high', status: 'open', detectedAt: '2026-10-16T11:15:00Z',
  },
  {
    incidentId: 'INC-1039', serviceId: 'review-service', title: 'Review consumer stopped processing events',
    severity: 'medium', status: 'investigating', detectedAt: '2026-10-16T10:06:00Z',
  },
  {
    incidentId: 'INC-1038', serviceId: 'user-service', title: 'Profile worker out of memory',
    severity: 'medium', status: 'resolved', detectedAt: '2026-10-16T09:40:00Z',
  },
  {
    incidentId: 'INC-1037', serviceId: 'api-gateway', title: 'Elevated gateway latency',
    severity: 'low', status: 'open', detectedAt: '2026-10-16T08:26:00Z',
  },
  {
    incidentId: 'INC-1036', serviceId: 'shipping-service', title: 'Carrier label API timeout',
    severity: 'critical', status: 'awaiting-review', detectedAt: '2026-10-15T18:20:00Z',
  },
  {
    incidentId: 'INC-1035', serviceId: 'search-service', title: 'Stale search index',
    severity: 'medium', status: 'investigating', detectedAt: '2026-10-15T14:30:00Z',
  },
  {
    incidentId: 'INC-1034', serviceId: 'invoice-service', title: 'Invoice delivery queue delay',
    severity: 'medium', status: 'open', detectedAt: '2026-10-15T11:45:00Z',
  },
  {
    incidentId: 'INC-1033', serviceId: 'catalog-service', title: 'Catalog import lag',
    severity: 'low', status: 'open', detectedAt: '2026-10-14T17:12:00Z',
  },
  {
    incidentId: 'INC-1032', serviceId: 'email-service', title: 'Delayed receipt emails',
    severity: 'low', status: 'open', detectedAt: '2026-10-14T16:30:00Z',
  },
  {
    incidentId: 'INC-1031', serviceId: 'cart-service', title: 'Cart revision conflict rate increased',
    severity: 'medium', status: 'open', detectedAt: '2026-10-14T15:42:00Z',
  },
  {
    incidentId: 'INC-1030', serviceId: 'warehouse-service', title: 'Dispatch acknowledgements delayed',
    severity: 'low', status: 'open', detectedAt: '2026-10-14T09:28:00Z',
  },
]

const longIncident: Incident = {
  incidentId: 'INC-1043-EXPORT20261016EUWESTCHECKOUTDELIVERYORDERACKNOWLEDGEMENTBACKLOG',
  serviceId: 'order-service',
  title: 'Regional order acknowledgement backlog',
  severity: 'low',
  status: 'open',
  detectedAt: '2026-10-16T14:38:00Z',
}

const latencySnapshot = { currentMs: 892, previousMs: 709, intervalHours: 1 }

export function readOverviewFixture(scenario: string | null) {
  if (scenario === 'loading') return { status: 'loading' } as const
  if (scenario === 'error') {
    return { status: 'error', message: 'The local Overview demo fixture could not be loaded.' } as const
  }

  const incidents = scenario === 'empty' ? [] : demoIncidents
  const visibleIncidents = scenario === 'long' ? [longIncident, ...incidents] : incidents
  const active = visibleIncidents.filter(({ status }) => status !== 'resolved')
  const runs = scenario === 'empty' ? [] : [paymentRun]

  return {
    status: 'ready',
    metrics: {
      active: active.length,
      critical: active.filter(({ severity }) => severity === 'critical').length,
      investigating: active.filter(({ status }) => status === 'investigating').length,
      running: runs.filter(({ status }) => status === 'running').length,
      latencyMs: latencySnapshot.currentMs,
      latencyChangeMs: latencySnapshot.currentMs - latencySnapshot.previousMs,
      latencyIntervalHours: latencySnapshot.intervalHours,
      healthy: demoServices.filter(({ health }) => health === 'healthy').length,
      totalServices: demoServices.length,
    },
    recentIncidents: [...visibleIncidents].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 5),
    affectedServices,
  } as const
}
