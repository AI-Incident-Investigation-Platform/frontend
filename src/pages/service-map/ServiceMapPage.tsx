import { useId } from 'react'
import { generatePath, Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { ServiceHealth } from '../../entities/investigation'
import { getDemoIncidents } from '../../mocks/incidents'
import { paymentService } from '../../mocks/investigation'
import { serviceDependencies, topologyServices } from '../../mocks/telemetry'
import { Button } from '../../shared/ui/controls'
import { Panel } from '../../shared/ui/surfaces'
import './service-map.css'

const graphWidth = 840
const graphHeight = 468
const nodeWidth = 176
const nodeHeight = 64

const positions: Record<string, readonly [number, number]> = {
  'api-gateway': [420, 62],
  'user-service': [160, 200],
  'order-service': [420, 200],
  'review-service': [680, 200],
  'payment-service': [292, 352],
  'inventory-service': [548, 352],
}

const healthLabels: Record<ServiceHealth, string> = {
  healthy: 'Healthy',
  degraded: 'Warning',
  critical: 'Critical',
}

function edgePath(source: string, target: string) {
  const [sx, sy] = positions[source]
  const [tx, ty] = positions[target]
  if (source === 'api-gateway' && target === 'payment-service') {
    return `M ${sx - nodeWidth / 2} ${sy} H 44 V ${ty} H ${tx - nodeWidth / 2 - 4}`
  }
  if (source === 'payment-service' && target === 'user-service') {
    return `M ${sx - nodeWidth / 2} ${sy - 13} H ${tx} V ${ty + nodeHeight / 2 + 4}`
  }
  if (sy === ty) {
    return `M ${sx + nodeWidth / 2} ${sy} H ${tx - nodeWidth / 2 - 4}`
  }
  const from = sy + nodeHeight / 2
  const to = ty - nodeHeight / 2 - 4
  return `M ${sx} ${from} V ${(from + to) / 2} H ${tx} V ${to}`
}

export function ServiceMapPage() {
  const [params, setParams] = useSearchParams()
  const marker = useId()
  const selected = topologyServices.find(({ serviceId }) => serviceId === params.get('serviceId'))
    ?? topologyServices.find(({ serviceId }) => serviceId === paymentService.serviceId)
    ?? topologyServices[0]
  const outgoing = serviceDependencies.filter(({ source }) => source === selected.serviceId)
  const incoming = serviceDependencies.filter(({ target }) => target === selected.serviceId)
  const openIncidents = getDemoIncidents(null).filter(({ serviceId, status }) =>
    serviceId === selected.serviceId && status !== 'resolved')

  function selectService(serviceId: string) {
    if (selected.serviceId === serviceId) return
    const next = new URLSearchParams(params)
    next.set('serviceId', serviceId)
    setParams(next, { preventScrollReset: true })
  }

  return (
    <div className="service-map-page">
      <div className="telemetry-hero map-hero">
        <div>
          <h1 className="page-title">Service dependency topology</h1>
          <p>Read-only topology from demo service metadata and traces</p>
        </div>
        <span className="map-period">Last 24 hours</span>
      </div>

      <div className="map-panels telemetry-panels">
        <Panel title="Service dependency map" meta={topologyServices.length + ' services'} className="map-diagram">
          <div className="map-viewport" tabIndex={0} role="region" aria-label="Service dependency topology">
            <div className="map-canvas">
              <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} aria-hidden="true">
                <defs>
                  <marker id={marker} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="context-stroke" />
                  </marker>
                </defs>
                {serviceDependencies.map(({ source, target }) => (
                  <path key={source + ':' + target} d={edgePath(source, target)} markerEnd={`url(#${marker})`}
                    className={source === selected.serviceId || target === selected.serviceId ? 'map-edge map-edge--selected' : 'map-edge'} />
                ))}
              </svg>
              {topologyServices.map(({ serviceId, health }) => {
                const [x, y] = positions[serviceId]
                return (
                  <Button key={serviceId} className={`map-node map-health--${health}`} data-service-id={serviceId}
                    aria-pressed={selected.serviceId === serviceId} onClick={() => selectService(serviceId)}
                    style={{ left: x / graphWidth * 100 + '%', top: y / graphHeight * 100 + '%' }}>
                    <strong>{serviceId}</strong>
                    <small>{healthLabels[health]}</small>
                  </Button>
                )
              })}
            </div>
          </div>
          <p className="map-scroll-hint">Scroll the map to see all six services.</p>
        </Panel>

        <Panel title="Selected service details" className="map-details">
          <div className="map-details__body" aria-live="polite">
            <h3>{selected.serviceId}</h3>
            <span className={`map-health-label map-health--${selected.health}`}>{healthLabels[selected.health]}</span>
            <dl className="map-facts">
              <div><dt>Error rate</dt><dd>{selected.errorRate}%</dd></div>
              <div><dt>P95 latency</dt><dd>{selected.latencyMs >= 1000 ? selected.latencyMs / 1000 + ' s' : selected.latencyMs + ' ms'}</dd></div>
              <div><dt>Restarts / 24h</dt><dd>{String(selected.restarts24h).padStart(2, '0')}</dd></div>
              <div><dt>Dependencies</dt><dd>{incoming.length + outgoing.length}</dd></div>
              <div><dt>Open incidents</dt><dd>{openIncidents.length}</dd></div>
            </dl>
            {(incoming.length > 0 || outgoing.length > 0) && <dl className="map-neighbors">
              {incoming.length > 0 && <div><dt>Called by</dt><dd>{incoming.map(({ source }) => source).join(', ')}</dd></div>}
              {outgoing.length > 0 && <div><dt>Calls</dt><dd>{outgoing.map(({ target }) => target).join(', ')}</dd></div>}
            </dl>}
            <Link className="text-link map-logs-link" to={paths.logsMetrics + '?' + new URLSearchParams({ serviceId: selected.serviceId })}>
              View service logs
            </Link>
            {openIncidents.length > 0 && <ul className="map-incident-links">
              {openIncidents.map(({ incidentId }) => <li key={incidentId}>
                <Link className="text-link" to={generatePath(paths.incidentDetail, { incidentId })}>{incidentId}</Link>
              </li>)}
            </ul>}
          </div>
        </Panel>
      </div>
    </div>
  )
}
