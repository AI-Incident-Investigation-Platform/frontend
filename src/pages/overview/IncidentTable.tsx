import { generatePath, Link } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { Incident } from '../../entities/investigation'
import { SeverityBadge, StatusBadge } from '../../shared/ui/badges'
import { DataTable } from '../../shared/ui/surfaces'

const detectedTime = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

export function IncidentTable({ incidents }: { incidents: readonly Incident[] }) {
  return (
    <div className="overview-incidents">
      <DataTable label="Recent incidents">
        <colgroup>
          <col className="overview-incident-column" />
          <col className="overview-service-column" />
          <col className="overview-severity-column" />
          <col className="overview-status-column" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Incident</th>
            <th scope="col">Service</th>
            <th scope="col">Severity</th>
            <th scope="col">Status</th>
            <th scope="col">Detected <span className="overview-timezone">UTC</span></th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.incidentId}>
              <th scope="row">
                <Link
                  to={generatePath(paths.incidentDetail, { incidentId: encodeURIComponent(incident.incidentId) })}
                  className="overview-incident-link"
                >
                  {incident.incidentId}
                </Link>
              </th>
              <td>{incident.serviceId}</td>
              <td><SeverityBadge severity={incident.severity} /></td>
              <td><StatusBadge status={incident.status} /></td>
              <td><time dateTime={incident.detectedAt}>{detectedTime.format(new Date(incident.detectedAt))}</time></td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <p className="overview-table-hint">Scroll the table to see all columns.</p>
    </div>
  )
}
