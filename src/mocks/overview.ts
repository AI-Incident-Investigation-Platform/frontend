import type { Service, Severity } from '../entities/investigation'
import { getDemoIncidents } from './incidents'
import { paymentRun, paymentService } from './investigation'

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

const latencySnapshot = { currentMs: 892, previousMs: 709, intervalHours: 1 }

export function readOverviewFixture(scenario: string | null) {
  if (scenario === 'loading') return { status: 'loading' } as const
  if (scenario === 'error') {
    return { status: 'error', message: 'The local Overview demo fixture could not be loaded.' } as const
  }

  const incidents = getDemoIncidents(scenario)
  const active = incidents.filter(({ status }) => status !== 'resolved')
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
    recentIncidents: [...incidents].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 5),
    affectedServices,
  } as const
}
