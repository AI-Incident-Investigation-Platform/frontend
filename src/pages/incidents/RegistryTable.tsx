import { generatePath, Link } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { IncidentOrder, RegistryIncident } from '../../features/incident-filters/filters'
import { demoWorkspace } from '../../mocks/investigation'
import { SeverityBadge, StatusBadge } from '../../shared/ui/badges'
import { DataTable } from '../../shared/ui/surfaces'

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
})
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', timeZone: 'UTC',
})

function formatDetection(timestamp: string) {
  const date = new Date(timestamp)
  const time = timeFormat.format(date)
  if (date.toISOString().slice(0, 10) === demoWorkspace.snapshotAt.slice(0, 10)) return time
  return dateFormat.format(date) + ' · ' + time
}

type Props = {
  incidents: readonly RegistryIncident[]
  order: IncidentOrder
  onSort: () => void
}

export function RegistryTable({ incidents, order, onSort }: Props) {
  const newestFirst = order === 'newest'

  return (
    <div className="registry-table">
      <DataTable label="Incident registry">
        <colgroup>
          <col className="registry-primary-column" />
          <col className="registry-service-column" />
          <col className="registry-severity-column" />
          <col className="registry-status-column" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">ID / Title</th>
            <th scope="col">Service</th>
            <th scope="col">Severity</th>
            <th scope="col">Status</th>
            <th scope="col" aria-sort={newestFirst ? 'descending' : 'ascending'}>
              <button className="registry-sort" type="button" onClick={onSort}
                aria-label={newestFirst ? 'Detected UTC, sort oldest first' : 'Detected UTC, sort newest first'}>
                Detected UTC <span aria-hidden="true">{newestFirst ? '↓' : '↑'}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.incidentId}>
              <th scope="row">
                <Link className="registry-incident-link"
                  to={generatePath(paths.incidentDetail, { incidentId: encodeURIComponent(incident.incidentId) })}>
                  {incident.incidentId}
                </Link>
                <span className="registry-incident-title">{incident.title}</span>
              </th>
              <td>{incident.serviceId}</td>
              <td><SeverityBadge severity={incident.severity} /></td>
              <td><StatusBadge status={incident.status} /></td>
              <td><time dateTime={incident.detectedAt}>{formatDetection(incident.detectedAt)}</time></td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <p className="registry-scroll-hint">Scroll the table to see all columns.</p>
    </div>
  )
}
