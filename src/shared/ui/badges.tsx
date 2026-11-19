import type {
  HypothesisStatus, IncidentStatus, RcaReport, RunStatus, ServiceHealth, Severity,
} from '../../entities/investigation'

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
type Status = IncidentStatus | RunStatus | ServiceHealth | HypothesisStatus | RcaReport['status']
type BadgeAppearance = { label: string; tone: Tone }

const statuses: Record<Status, BadgeAppearance> = {
  open: { label: 'Open', tone: 'neutral' },
  investigating: { label: 'Investigating', tone: 'info' },
  'awaiting-review': { label: 'Awaiting review', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'success' },
  pending: { label: 'Pending', tone: 'neutral' },
  running: { label: 'Running', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
  healthy: { label: 'Healthy', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  critical: { label: 'Critical', tone: 'danger' },
  supported: { label: 'Supported', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  ready: { label: 'Ready', tone: 'info' },
  reviewed: { label: 'Reviewed', tone: 'success' },
}

const severities: Record<Severity, BadgeAppearance> = {
  critical: { label: 'Critical', tone: 'danger' },
  high: { label: 'High', tone: 'warning' },
  medium: { label: 'Medium', tone: 'info' },
  low: { label: 'Low', tone: 'neutral' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, tone } = statuses[status]
  return <span className={`badge badge--${tone}`}>{label}</span>
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, tone } = severities[severity]
  return <span className={`badge badge--${tone}`}>{label}</span>
}
