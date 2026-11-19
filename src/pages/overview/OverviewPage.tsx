import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import { readOverviewFixture } from '../../mocks/overview'
import { EmptyState, ErrorState, LoadingState, MetricCard, Panel } from '../../shared/ui/surfaces'
import { IncidentTable } from './IncidentTable'
import { ServiceHealthRow } from './ServiceHealthRow'
import './overview.css'

type OverviewFixture = ReturnType<typeof readOverviewFixture>
type ReadyOverview = Extract<OverviewFixture, { status: 'ready' }>

function OverviewContent({ metrics, recentIncidents, affectedServices }: ReadyOverview) {
  const latencyChange = metrics.latencyChangeMs > 0 ? `+${metrics.latencyChangeMs}` : metrics.latencyChangeMs

  return (
    <>
      <section className="overview-kpis" aria-label="Operational metrics">
        <MetricCard label="Active Incidents" value={metrics.active} hint={`${metrics.critical} critical`}
          tone={metrics.critical ? 'danger' : 'neutral'} />
        <MetricCard label="Investigating" value={String(metrics.investigating).padStart(2, '0')}
          hint={`${metrics.running} ${metrics.running === 1 ? 'agent' : 'agents'} running`} tone="info" />
        <MetricCard label="P95 Latency" value={`${metrics.latencyMs} ms`}
          hint={`${latencyChange} ms / ${metrics.latencyIntervalHours} h`}
          tone={metrics.latencyChangeMs > 0 ? 'warning' : 'neutral'} />
        <MetricCard label="Healthy Services" value={`${metrics.healthy} / ${metrics.totalServices}`}
          hint={`${affectedServices.length} require attention`} tone="success" />
      </section>

      <div className="overview-panels">
        <Panel title="Recent incidents" meta={`${recentIncidents.length} records`}>
          {recentIncidents.length > 0
            ? <IncidentTable incidents={recentIncidents} />
            : <EmptyState title="No recent incidents" description="This demo snapshot contains no incident records." />}
        </Panel>
        <Panel title="Services requiring attention" meta={`${affectedServices.length} services`}
          className="overview-services-panel">
          <ul className="overview-service-list">
            {affectedServices.map((service) => <ServiceHealthRow key={service.serviceId} service={service} />)}
          </ul>
        </Panel>
      </div>
    </>
  )
}

export function OverviewPage() {
  const [searchParams] = useSearchParams()
  const fixture = readOverviewFixture(searchParams.get('demo'))

  return (
    <div className="overview-page">
      <h1 className="page-title">Service observability</h1>
      <p className="overview-description">Telemetry health and active incidents across connected systems</p>
      {fixture.status === 'ready' && <OverviewContent {...fixture} />}
      {fixture.status === 'loading' && (
        <Panel className="overview-state"><LoadingState title="Loading overview…" /></Panel>
      )}
      {fixture.status === 'error' && (
        <Panel className="overview-state">
          <ErrorState
            title="Overview unavailable"
            description={fixture.message}
            action={<Link className="text-link" to={paths.overview}>Open default demo</Link>}
          />
        </Panel>
      )}
    </div>
  )
}
