import type { TelemetryTrace, TraceSpan } from '../../entities/telemetry'
import { isInSnapshotRange, type TelemetryHours } from './timeRange'

export interface TraceFilters {
  service: string
  status: TelemetryTrace['status'] | ''
  minDurationMs: number
  hours: TelemetryHours
}

export function filterTraces(traces: readonly TelemetryTrace[], filters: TraceFilters, snapshotAt: string) {
  return traces.filter((trace) =>
    (!filters.service || trace.spans.some(({ serviceId }) => filters.service === serviceId)) &&
    (!filters.status || trace.status === filters.status) &&
    trace.durationMs >= filters.minDurationMs &&
    isInSnapshotRange(trace.startedAt, filters.hours, snapshotAt),
  ).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
}

export function projectSpan(trace: TelemetryTrace, span: TraceSpan) {
  const { durationMs: total } = trace
  const { startOffsetMs, durationMs } = span
  if (!Number.isFinite(total) || !Number.isFinite(startOffsetMs) || !Number.isFinite(durationMs) ||
    total <= 0 || startOffsetMs < 0 || durationMs <= 0 || startOffsetMs + durationMs > total) {
    return null
  }

  let depth = 0
  let child = span
  const seen = new Set([span.spanId])
  for (let parentId = span.parentSpanId; parentId; depth += 1) {
    const parent = trace.spans.find(({ spanId }) => spanId === parentId)
    if (!parent || seen.has(parentId) || child.startOffsetMs < parent.startOffsetMs ||
      child.startOffsetMs + child.durationMs > parent.startOffsetMs + parent.durationMs) {
      return null
    }
    seen.add(parentId)
    child = parent
    parentId = parent.parentSpanId
  }

  return { left: startOffsetMs / total * 100, width: durationMs / total * 100, depth }
}
