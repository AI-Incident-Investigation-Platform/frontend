import { describe, expect, it } from 'vitest'
import { paymentIncident } from '../../mocks/investigation'
import { defaultFilters, filterIncidents, type RegistryIncident } from './filters'

const snapshotAt = '2026-10-16T14:40:00Z'
const records: readonly RegistryIncident[] = [
  { ...paymentIncident, project: 'E-commerce' },
  {
    incidentId: 'INC-1041', title: 'Slow order processing', serviceId: 'order-service',
    severity: 'critical', status: 'open', project: 'E-commerce', detectedAt: '2026-10-16T17:20:00+03:00',
  },
  {
    incidentId: 'INC-1039', title: 'Consumer lag', serviceId: 'review-service',
    severity: 'high', status: 'investigating', project: 'Platform', detectedAt: '2026-10-15T14:40:00Z',
  },
  {
    incidentId: 'INC-1036', title: 'Gateway connection timeout', serviceId: 'api-gateway',
    severity: 'medium', status: 'resolved', project: 'Platform', detectedAt: '2026-10-15T14:39:59Z',
  },
]

describe('filterIncidents', () => {
  it.each(['inc-1042', 'PAYMENT', '  HTTP 500 '])('finds the canonical incident for %s', (search) => {
    const result = filterIncidents(records, { ...defaultFilters, search }, 'newest', snapshotAt)
    expect(result.map(({ incidentId }) => incidentId)).toEqual(['INC-1042'])
  })

  it('combines severity, status, project and search with AND', () => {
    const filters = { ...defaultFilters, severity: 'critical', status: 'investigating', project: 'E-commerce' } as const
    expect(filterIncidents(records, filters, 'newest', snapshotAt).map(({ incidentId }) => incidentId))
      .toEqual(['INC-1042'])
    expect(filterIncidents(records, { ...filters, project: 'Platform' }, 'newest', snapshotAt)).toEqual([])
    expect(filterIncidents(records, { ...filters, search: 'order-service' }, 'newest', snapshotAt)).toEqual([])
  })

  it('includes the exact time cutoff and excludes older records', () => {
    const result = filterIncidents(records, { ...defaultFilters, range: '24h' }, 'newest', snapshotAt)
    expect(result.map(({ incidentId }) => incidentId)).toEqual(['INC-1042', 'INC-1041', 'INC-1039'])
  })

  it('sorts both ways by timestamp across offsets and leaves the input intact', () => {
    const shuffled = [records[1], records[3], records[0], records[2]]
    const ids = (order: 'oldest' | 'newest') =>
      filterIncidents(shuffled, defaultFilters, order, snapshotAt).map(({ incidentId }) => incidentId)

    expect(ids('newest')).toEqual(['INC-1042', 'INC-1041', 'INC-1039', 'INC-1036'])
    expect(ids('oldest')).toEqual(['INC-1036', 'INC-1039', 'INC-1041', 'INC-1042'])
    expect(shuffled[0].incidentId).toBe('INC-1041')
  })
})
