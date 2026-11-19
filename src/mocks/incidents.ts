import type { RegistryIncident } from '../features/incident-filters/filters'
import { paymentIncident } from './investigation'

const demoIncidents: readonly RegistryIncident[] = [
  { ...paymentIncident, project: 'E-commerce' },
  {
    incidentId: 'INC-1041', serviceId: 'order-service', title: 'Order processing p95 latency increased',
    severity: 'high', status: 'awaiting-review', detectedAt: '2026-10-16T13:20:00Z', project: 'E-commerce',
  },
  {
    incidentId: 'INC-1040', serviceId: 'inventory-service', title: 'Inventory worker pool exhausted',
    severity: 'high', status: 'open', detectedAt: '2026-10-16T11:15:00Z', project: 'E-commerce',
  },
  {
    incidentId: 'INC-1039', serviceId: 'review-service', title: 'Review consumer stopped processing events',
    severity: 'medium', status: 'investigating', detectedAt: '2026-10-16T10:06:00Z', project: 'Platform',
  },
  {
    incidentId: 'INC-1038', serviceId: 'user-service', title: 'Profile worker out of memory',
    severity: 'medium', status: 'resolved', detectedAt: '2026-10-16T09:40:00Z', project: 'Platform',
  },
  {
    incidentId: 'INC-1037', serviceId: 'api-gateway', title: 'Elevated gateway latency',
    severity: 'low', status: 'open', detectedAt: '2026-10-16T08:26:00Z', project: 'Platform',
  },
  {
    incidentId: 'INC-1036', serviceId: 'shipping-service', title: 'Carrier label API timeout',
    severity: 'critical', status: 'awaiting-review', detectedAt: '2026-10-15T18:20:00Z', project: 'E-commerce',
  },
  {
    incidentId: 'INC-1035', serviceId: 'search-service', title: 'Stale search index',
    severity: 'medium', status: 'investigating', detectedAt: '2026-10-15T14:30:00Z', project: 'Platform',
  },
  {
    incidentId: 'INC-1034', serviceId: 'invoice-service', title: 'Invoice delivery queue delay',
    severity: 'medium', status: 'open', detectedAt: '2026-10-15T11:45:00Z', project: 'E-commerce',
  },
  {
    incidentId: 'INC-1033', serviceId: 'catalog-service', title: 'Catalog import lag',
    severity: 'low', status: 'open', detectedAt: '2026-10-14T17:12:00Z', project: 'E-commerce',
  },
  {
    incidentId: 'INC-1032', serviceId: 'email-service', title: 'Delayed receipt emails',
    severity: 'low', status: 'open', detectedAt: '2026-10-14T16:30:00Z', project: 'Platform',
  },
  {
    incidentId: 'INC-1031', serviceId: 'cart-service', title: 'Cart revision conflict rate increased',
    severity: 'medium', status: 'open', detectedAt: '2026-10-14T15:42:00Z', project: 'E-commerce',
  },
  {
    incidentId: 'INC-1030', serviceId: 'warehouse-service', title: 'Dispatch acknowledgements delayed',
    severity: 'low', status: 'open', detectedAt: '2026-10-14T09:28:00Z', project: 'E-commerce',
  },
]

const longIncident: RegistryIncident = {
  incidentId: 'INC-1043-EXPORT20261016EUWESTCHECKOUTDELIVERYORDERACKNOWLEDGEMENTBACKLOG',
  serviceId: 'order-service',
  title: 'Regional order acknowledgement backlog',
  severity: 'low',
  status: 'open',
  detectedAt: '2026-10-16T14:38:00Z',
  project: 'E-commerce',
}

export function getDemoIncidents(scenario: string | null): readonly RegistryIncident[] {
  if (scenario === 'empty') return []
  if (scenario === 'long') return [longIncident, ...demoIncidents]
  return demoIncidents
}

export function readIncidentFixture(scenario: string | null) {
  if (scenario === 'loading') return { status: 'loading' } as const
  if (scenario === 'error') {
    return { status: 'error', message: 'The local incident fixture could not be loaded.' } as const
  }
  return { status: 'ready', incidents: getDemoIncidents(scenario) } as const
}
