import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filterTraces, type TraceFilters } from '../../features/telemetry/traceQuery'
import { readTelemetryHours, telemetryRanges } from '../../features/telemetry/timeRange'
import { demoWorkspace } from '../../mocks/investigation'
import { demoTraces, topologyServices, traceWithManySpans } from '../../mocks/telemetry'
import { Button, Select, TextInput } from '../../shared/ui/controls'
import { DataTable, EmptyState, LoadingState, Panel } from '../../shared/ui/surfaces'
import { CaseTime } from '../incident-detail/presentation'
import { TraceWaterfall } from './TraceWaterfall'
import './traces.css'

type DraftFilters = Omit<TraceFilters, 'minDurationMs'> & { minDuration: string }
const defaultFilters: DraftFilters = { service: '', status: 'error', minDuration: '500', hours: 1 }

function applyFilters(filters: DraftFilters) {
  return { service: filters.service, status: filters.status, minDurationMs: Number(filters.minDuration), hours: filters.hours }
}

function TraceExplorer({ demo }: { demo: string | null }) {
  const [params, setParams] = useSearchParams()
  const traceId = params.get('traceId')
  const dataset = demo === 'empty' ? [] : demo === 'many' ? [traceWithManySpans, ...demoTraces.slice(1)] : demoTraces
  const [draft, setDraft] = useState<DraftFilters>(() => {
    const initialTraces = filterTraces(dataset, applyFilters(defaultFilters), demoWorkspace.snapshotAt)
    if (traceId && dataset.some((trace) => trace.traceId === traceId) &&
      !initialTraces.some((trace) => trace.traceId === traceId)) {
      return { ...defaultFilters, status: '', minDuration: '', hours: 24 }
    }
    return defaultFilters
  })
  const [applied, setApplied] = useState(() => applyFilters(draft))
  const rows = filterTraces(dataset, applied, demoWorkspace.snapshotAt)
  const selected = traceId ? rows.find((trace) => trace.traceId === traceId) : rows[0]
  const loading = demo === 'loading'

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFilters = applyFilters(draft)
    setApplied(nextFilters)
    if (traceId && !filterTraces(dataset, nextFilters, demoWorkspace.snapshotAt).some((trace) => trace.traceId === traceId)) {
      const next = new URLSearchParams(params)
      next.delete('traceId')
      setParams(next, { preventScrollReset: true })
    }
  }

  function openTrace(id: string) {
    if (selected?.traceId === id) return
    const next = new URLSearchParams(params)
    next.set('traceId', id)
    setParams(next, { preventScrollReset: true })
  }

  return (
    <div className="traces-page telemetry-panels">
      <div className="telemetry-hero">
        <h1 className="page-title">Traces</h1>
        <p>Distributed traces and spans from an OpenTelemetry / Tempo demo snapshot</p>
      </div>

      <Panel className="trace-query telemetry-query">
        <form onSubmit={search}>
          <Select label="Service in trace" name="service" value={draft.service}
            onChange={(event) => setDraft({ ...draft, service: event.currentTarget.value })}>
            <option value="">All services</option>
            {topologyServices.map(({ serviceId }) => <option key={serviceId}>{serviceId}</option>)}
            <option>postgres</option>
          </Select>
          <Select label="Status" name="status" value={draft.status}
            onChange={(event) => {
              const status = event.currentTarget.value
              setDraft({ ...draft, status: status === 'ok' || status === 'error' ? status : '' })
            }}>
            <option value="">All statuses</option>
            <option value="ok">OK</option>
            <option value="error">Error</option>
          </Select>
          <TextInput label="Min. duration (ms)" name="duration" type="number" min={0} max={86400000}
            placeholder="0" value={draft.minDuration}
            onChange={(event) => setDraft({ ...draft, minDuration: event.currentTarget.value })} />
          <Select label="Time range" name="hours" value={draft.hours}
            onChange={(event) => setDraft({ ...draft, hours: readTelemetryHours(event.currentTarget.value, 1) })}>
            {telemetryRanges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Button type="submit" disabled={loading}>Search traces</Button>
        </form>
      </Panel>

      <Panel title="Recent traces" meta={loading ? undefined : rows.length + (rows.length === 1 ? ' record' : ' records')} className="trace-results">
        {loading ? <LoadingState title="Loading demo traces…" />
          : dataset.length === 0 ? <EmptyState title="No traces in this demo" />
          : rows.length === 0 ? <EmptyState title="No matching traces" description="Change the service, status, minimum duration or time range." />
          : <DataTable label="Recent traces">
            <thead>
              <tr>
                <th scope="col">Trace ID</th><th scope="col">Root service</th><th scope="col">Duration</th>
                <th scope="col">Spans</th><th scope="col">Status</th><th scope="col">Start time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((trace) => (
                <tr key={trace.traceId} className={selected?.traceId === trace.traceId ? 'trace-row--selected' : undefined}>
                  <th scope="row">
                    <button className="trace-select" type="button" aria-pressed={selected?.traceId === trace.traceId}
                      onClick={() => openTrace(trace.traceId)}><code>{trace.traceId}</code></button>
                  </th>
                  <td><code>{trace.rootService}</code></td><td>{trace.durationMs} ms</td><td>{trace.spans.length}</td>
                  <td className={'trace-status--' + trace.status}>{trace.status === 'ok' ? 'OK' : 'Error'}</td>
                  <td><CaseTime at={trace.startedAt} includeDate precise /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>}
      </Panel>

      {!loading && selected && <TraceWaterfall key={selected.traceId} trace={selected} />}
      {!loading && traceId && !selected && rows.length > 0 && (
        <Panel title="Trace waterfall"><EmptyState title="Trace unavailable" description="Choose a trace from the current results." /></Panel>
      )}
    </div>
  )
}

export function TracesPage() {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  return <TraceExplorer key={demo} demo={demo} />
}
