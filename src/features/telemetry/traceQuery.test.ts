import { describe, expect, it } from 'vitest'
import { canonicalTrace, demoTraces, traceWithManySpans } from '../../mocks/telemetry'
import { filterTraces, projectSpan } from './traceQuery'

const snapshot = '2026-10-16T14:40:00Z'

describe('trace filters', () => {
  it('combines a participating service, status, minimum duration and time range', () => {
    expect(filterTraces(demoTraces, {
      service: 'payment-service', status: 'error', minDurationMs: 1400, hours: 1,
    }, snapshot)).toEqual([canonicalTrace])
    expect(filterTraces(demoTraces, {
      service: 'payment-service', status: 'error', minDurationMs: 2000, hours: 1,
    }, snapshot)).toEqual([])
  })
})

describe('waterfall geometry', () => {
  it('gives the root span the entire width and projects child offset and duration proportionally', () => {
    expect(projectSpan(canonicalTrace, canonicalTrace.spans[0])).toEqual({ left: 0, width: 100, depth: 0 })
    const acquire = canonicalTrace.spans.find(({ serviceId }) => serviceId === 'postgres')
    expect(acquire).toBeDefined()
    if (!acquire) return
    const projected = projectSpan(canonicalTrace, acquire)
    expect(projected?.left).toBeCloseTo(131 / 1480 * 100)
    expect(projected?.width).toBeCloseTo(1310 / 1480 * 100)
    expect(projected?.depth).toBe(3)
    expect(projectSpan(canonicalTrace, { ...acquire, startOffsetMs: 200 })).toBeNull()
  })

  it('stays inside the trace and preserves parent indentation for a crowded waterfall', () => {
    expect(traceWithManySpans.spans.length).toBeGreaterThan(20)
    for (const span of traceWithManySpans.spans) {
      const projected = projectSpan(traceWithManySpans, span)
      expect(projected).not.toBeNull()
      expect((projected?.left ?? 0) + (projected?.width ?? 0)).toBeLessThanOrEqual(100)
      if (span.operation.startsWith('pool.queue_check')) expect(projected?.depth).toBe(4)
    }
  })
})
