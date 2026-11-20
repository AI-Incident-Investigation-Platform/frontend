import type { Service, Trace } from './investigation'

export interface ServiceTelemetry extends Service {
  readonly errorRate: number
  readonly latencyMs: number
  readonly restarts24h: number
}

export interface ServiceDependency {
  readonly source: Service['serviceId']
  readonly target: Service['serviceId']
}

export type LogLevel = 'ERROR' | 'WARN' | 'INFO'

export interface LogEntry {
  readonly logId: string
  readonly timestamp: string
  readonly serviceId: Service['serviceId']
  readonly level: LogLevel
  readonly message: string
  readonly metadata: Readonly<Record<string, string>>
  readonly excerpt?: string
  readonly traceId?: string
}

export interface MetricSnapshot {
  readonly label: string
  readonly value: number
  readonly unit: '%' | 's'
  readonly max: number
  readonly tone: 'danger' | 'warning' | 'success'
}

export interface TraceSpan {
  readonly spanId: string
  readonly parentSpanId?: string
  readonly serviceId: Service['serviceId']
  readonly operation: string
  readonly status: Trace['status']
  readonly startOffsetMs: number
  readonly durationMs: number
  readonly detail: string
}

export interface TelemetryTrace extends Trace {
  readonly rootService: Service['serviceId']
  readonly spans: readonly TraceSpan[]
}
