export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'open' | 'investigating' | 'awaiting-review' | 'resolved'
export type RunStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed' | 'awaiting-review'
export type ServiceHealth = 'healthy' | 'degraded' | 'critical'
export type ToolEventStatus = 'running' | 'completed' | 'failed'
export type HypothesisStatus = 'supported' | 'rejected' | 'pending'

export interface Service {
  serviceId: string
  health: ServiceHealth
}

export interface Incident {
  incidentId: string
  serviceId: Service['serviceId']
  title: string
  severity: Severity
  status: IncidentStatus
  detectedAt: string
}

export interface InvestigationRun {
  runId: string
  incidentId: Incident['incidentId']
  status: RunStatus
  startedAt: string
  currentStep: number
  totalSteps: number
}

export interface ToolEvent {
  eventId: string
  runId: InvestigationRun['runId']
  tool: string
  status: ToolEventStatus
  timestamp: string
  summary: string
}

export interface Trace {
  traceId: string
  incidentId: Incident['incidentId']
  serviceId: Service['serviceId']
  operation: string
  startedAt: string
  durationMs: number
  status: 'ok' | 'error'
}

type EvidenceSource =
  | { kind: 'tool-event'; eventId: ToolEvent['eventId'] }
  | { kind: 'trace'; traceId: Trace['traceId'] }

export interface Evidence {
  evidenceId: string
  runId: InvestigationRun['runId']
  source: EvidenceSource
  timestamp: string
  summary: string
}

export interface Hypothesis {
  hypothesisId: string
  runId: InvestigationRun['runId']
  title: string
  status: HypothesisStatus
  evidenceIds: readonly Evidence['evidenceId'][]
}

export type RcaReport = {
  incidentId: Incident['incidentId']
  runId: InvestigationRun['runId']
} & (
  | { status: 'pending' }
  | { status: 'ready'; summary: string }
  | { status: 'reviewed'; summary: string; reviewedAt: string }
)
