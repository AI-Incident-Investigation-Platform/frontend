import type { Ref } from 'react'
import type { IncidentFilters } from '../../features/incident-filters/filters'
import { Select, TextInput } from '../../shared/ui/controls'
import { Panel } from '../../shared/ui/surfaces'

type Props = {
  filters: IncidentFilters
  projects: readonly string[]
  searchRef: Ref<HTMLInputElement>
  onChange: <Field extends keyof IncidentFilters>(field: Field, value: IncidentFilters[Field]) => void
}

export function RegistryFilters({ filters, projects, searchRef, onChange }: Props) {
  return (
    <Panel className="registry-filter-panel">
      <form className="registry-filters" role="search" aria-label="Incident filters"
        onSubmit={(event) => event.preventDefault()}>
        <TextInput
          ref={searchRef}
          label="Search by ID, service, or title"
          type="search"
          name="search"
          placeholder="Search by ID, service, or title"
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
        />
        <Select
          label="Severity"
          name="severity"
          value={filters.severity}
          onChange={(event) => onChange('severity', event.target.value as IncidentFilters['severity'])}
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select
          label="Status"
          name="status"
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value as IncidentFilters['status'])}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="awaiting-review">Awaiting review</option>
          <option value="resolved">Resolved</option>
        </Select>
        <Select label="Project" name="project" value={filters.project}
          onChange={(event) => onChange('project', event.target.value)}>
          <option value="">All projects</option>
          {projects.map((project) => <option key={project} value={project}>{project}</option>)}
        </Select>
        <Select
          label="Time range"
          name="range"
          value={filters.range}
          onChange={(event) => onChange('range', event.target.value as IncidentFilters['range'])}
        >
          <option value="">All time</option>
          <option value="6h">Last 6 hours</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </Select>
      </form>
    </Panel>
  )
}
