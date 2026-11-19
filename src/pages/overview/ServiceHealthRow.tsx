import { Link } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { AffectedService } from '../../mocks/overview'
import { SeverityBadge } from '../../shared/ui/badges'

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

function formatSignal(signal: AffectedService['signal']) {
  switch (signal.kind) {
    case 'error-rate':
      return `5xx rate ${signal.percent}%`
    case 'latency':
      return `p95 latency ${signal.milliseconds / 1000} s`
    case 'consumer-lag':
      return `Consumer lag ${compactNumber.format(signal.messages).toLowerCase()}`
  }
}

export function ServiceHealthRow({ service }: { service: AffectedService }) {
  const { serviceId, severity, signal } = service
  return (
    <li>
      <Link
        className={`overview-service-link overview-service-link--${severity}`}
        to={{ pathname: paths.serviceMap, search: new URLSearchParams({ serviceId }).toString() }}
      >
        <span className="overview-service-dot" aria-hidden="true" />
        <span className="overview-service-details">
          <span className="overview-service-name">{serviceId}</span>
          <span className="overview-service-signal">{formatSignal(signal)}</span>
        </span>
        <SeverityBadge severity={severity} />
      </Link>
    </li>
  )
}
