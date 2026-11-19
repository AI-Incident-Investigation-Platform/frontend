import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import {
  defaultFilters,
  filterIncidents,
  type IncidentFilters,
  type IncidentOrder,
  type RegistryIncident,
} from '../../features/incident-filters/filters'
import { demoWorkspace } from '../../mocks/investigation'
import { readIncidentFixture } from '../../mocks/incidents'
import { Button } from '../../shared/ui/controls'
import { EmptyState, ErrorState, LoadingState, Panel } from '../../shared/ui/surfaces'
import { RegistryFilters } from './RegistryFilters'
import { RegistryTable } from './RegistryTable'
import './incidents.css'

function IncidentRegistry({ incidents }: { incidents: readonly RegistryIncident[] }) {
  const [filters, setFilters] = useState<IncidentFilters>(defaultFilters)
  const [order, setOrder] = useState<IncidentOrder>('newest')
  const search = useRef<HTMLInputElement>(null)
  const projects = [...new Set(incidents.map(({ project }) => project))].sort()
  const rows = filterIncidents(incidents, filters, order, demoWorkspace.snapshotAt)
  const hasFilters = Object.values(filters).some(Boolean)

  function changeFilter<Field extends keyof IncidentFilters>(field: Field, value: IncidentFilters[Field]) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function resetFilters() {
    setFilters(defaultFilters)
    search.current?.focus()
  }

  return (
    <>
      <RegistryFilters filters={filters} projects={projects} searchRef={search} onChange={changeFilter} />
      <section className="registry-results" aria-labelledby="registry-results-title">
        <Panel className="registry-results-panel">
          <div className="registry-results-heading">
            <h2 id="registry-results-title">All incidents</h2>
            <p role="status">{rows.length} {rows.length === 1 ? 'record' : 'records'}</p>
            <Button disabled={!hasFilters} onClick={resetFilters}>Reset filters</Button>
          </div>
          {rows.length > 0 ? (
            <RegistryTable incidents={rows} order={order}
              onSort={() => setOrder((current) => current === 'newest' ? 'oldest' : 'newest')} />
          ) : (
            <EmptyState
              title={incidents.length ? 'No matching incidents' : 'No incidents in this demo'}
              description={incidents.length ? 'Change the search or reset the filters.' : 'This snapshot contains no incident records.'}
            />
          )}
        </Panel>
        <p className="registry-total">Showing {rows.length} of {incidents.length} incidents</p>
      </section>
    </>
  )
}

export function IncidentsPage() {
  const [params] = useSearchParams()
  const scenario = params.get('demo')
  const fixture = readIncidentFixture(scenario)

  return (
    <div className="incidents-page">
      <div className="registry-heading">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p>Search, filter and review incident history across connected projects</p>
        </div>
        <div className="registry-demo-action">
          <Button disabled aria-describedby="investigation-demo-label">+ New investigation</Button>
          <span id="investigation-demo-label">Demo only</span>
        </div>
      </div>
      {fixture.status === 'ready' && <IncidentRegistry key={scenario} incidents={fixture.incidents} />}
      {fixture.status === 'loading' && (
        <Panel className="registry-state"><LoadingState title="Loading incidents…" /></Panel>
      )}
      {fixture.status === 'error' && (
        <Panel className="registry-state">
          <ErrorState title="Incidents unavailable" description={fixture.message}
            action={<Link className="text-link" to={paths.incidents}>Open default demo</Link>} />
        </Panel>
      )}
    </div>
  )
}
