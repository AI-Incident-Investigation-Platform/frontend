import type { Incident, IncidentStatus, Severity } from '../../entities/investigation'

const rangeHours = { '6h': 6, '24h': 24, '7d': 7 * 24, '30d': 30 * 24 } as const

export type RegistryIncident = Incident & { project: string }
export type IncidentOrder = 'newest' | 'oldest'

export interface IncidentFilters {
  search: string
  severity: Severity | ''
  status: IncidentStatus | ''
  project: string
  range: keyof typeof rangeHours | ''
}

export const defaultFilters: IncidentFilters = {
  search: '',
  severity: '',
  status: '',
  project: '',
  range: '',
}

export function filterIncidents(
  incidents: readonly RegistryIncident[],
  filters: IncidentFilters,
  order: IncidentOrder,
  snapshotAt: string,
): RegistryIncident[] {
  const query = filters.search.trim().toLowerCase()
  const snapshot = Date.parse(snapshotAt)
  const cutoff = filters.range ? snapshot - rangeHours[filters.range] * 3_600_000 : -Infinity
  const direction = order === 'newest' ? -1 : 1

  return incidents
    .map((incident) => ({ incident, timestamp: Date.parse(incident.detectedAt) }))
    .filter(({ incident, timestamp }) => (
      (!query || [incident.incidentId, incident.serviceId, incident.title]
        .some((value) => value.toLowerCase().includes(query)))
      && (!filters.severity || incident.severity === filters.severity)
      && (!filters.status || incident.status === filters.status)
      && (!filters.project || incident.project === filters.project)
      && (!filters.range || (timestamp >= cutoff && timestamp <= snapshot))
    ))
    .sort((a, b) => direction * (a.timestamp - b.timestamp))
    .map(({ incident }) => incident)
}
