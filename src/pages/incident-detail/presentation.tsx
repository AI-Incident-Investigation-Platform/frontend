import { Link } from 'react-router-dom'
import type { Evidence } from '../../entities/investigation'

const clock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
})
const preciseClock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC',
})

export const evidenceLabels: Record<Evidence['source']['kind'], string> = {
  log: 'Log', metric: 'Metric', trace: 'Trace', deployment: 'Deployment', code: 'Code',
}

export type EvidenceHref = (id: string) => string

export function formatUtcTime(timestamp: string, precise = false) {
  return (precise ? preciseClock : clock).format(new Date(timestamp))
}

export function formatUtcDateTime(timestamp: string, precise = false) {
  return new Date(timestamp).toISOString().slice(0, 10) + ' · ' + formatUtcTime(timestamp, precise)
}

export function CaseTime({ at, precise = false, includeDate = false }: { at: string; precise?: boolean; includeDate?: boolean }) {
  return <time dateTime={at}>{includeDate ? formatUtcDateTime(at, precise) : formatUtcTime(at, precise)} UTC</time>
}

export function EvidenceLinks({ evidence, href }: { evidence: readonly Evidence[]; href: EvidenceHref }) {
  return (
    <ul className="detail-links">
      {evidence.map((item) => (
        <li key={item.evidenceId}>
          <Link className="text-link" to={href(item.evidenceId)}>
            {evidenceLabels[item.source.kind]} · <code>{item.evidenceId}</code>
          </Link>
        </li>
      ))}
    </ul>
  )
}
