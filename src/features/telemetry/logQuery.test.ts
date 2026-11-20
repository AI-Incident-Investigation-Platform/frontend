import { describe, expect, it } from 'vitest'
import type { LogEntry } from '../../entities/telemetry'
import { filterLogs, parseLogQuery } from './logQuery'

const snapshot = '2026-10-16T14:40:00Z'
const entry: LogEntry = {
  logId: 'log-1', timestamp: '2026-10-16T14:35:09Z', serviceId: 'payment-service',
  level: 'ERROR', message: 'PostgreSQL connection timeout', metadata: { operation: 'checkout.charge' },
}

describe('demo log query', () => {
  it('combines service, level, keyword and range, including the exact time boundary', () => {
    const cutoff = { ...entry, logId: 'cutoff', timestamp: '2026-10-16T13:40:00Z' }
    const query = parseLogQuery('service:payment-service level:error keyword:"CONNECTION TIMEOUT"')
    expect(query).not.toBeNull()
    if (!query) return
    expect(filterLogs([
      cutoff, { ...entry, logId: 'old', timestamp: '2026-10-16T13:39:59Z' },
      { ...entry, logId: 'other', serviceId: 'order-service' }, { ...entry, logId: 'warn', level: 'WARN' },
      { ...entry, logId: 'keyword', message: 'Payment authorization failed' }, entry,
    ], query, 1, snapshot)).toEqual([entry, cutoff])
  })

  it.each(['service.name:payment-service AND log.level:ERROR', 'level:DEBUG', 'service:api-gateway OR level:ERROR',
    'keyword:"never closed', 'level:INFO level:WARN'])('rejects unsupported syntax %s', (query) => {
    expect(parseLogQuery(query)).toBeNull()
  })

  it('allows an empty query and returns no matches for an unknown keyword', () => {
    expect(parseLogQuery('  ')).toEqual({})
    expect(filterLogs([entry], { keyword: 'never matched' }, 24, snapshot)).toEqual([])
  })
})
