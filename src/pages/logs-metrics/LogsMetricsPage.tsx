import { useId, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import { filterLogs, parseLogQuery } from '../../features/telemetry/logQuery'
import { readTelemetryHours, telemetryRanges, type TelemetryHours } from '../../features/telemetry/timeRange'
import { demoWorkspace, paymentService } from '../../mocks/investigation'
import { demoLogs, paymentMetrics } from '../../mocks/telemetry'
import { Button, Select, TextInput } from '../../shared/ui/controls'
import { EmptyState, ErrorState, LoadingState, Panel } from '../../shared/ui/surfaces'
import { CaseTime } from '../incident-detail/presentation'
import { LogRecord } from './LogRecord'
import './logs-metrics.css'

const queryHelp = 'Mock query supports service:<id>, level:ERROR|WARN|INFO and keyword:"text". Terms are combined with AND.'

function LogsExplorer({ serviceId, demo }: { serviceId: string; demo: string | null }) {
  const logsId = useId()
  const logsTabId = logsId + '-tab'
  const logsPanelId = logsId + '-panel'
  const initialQuery = serviceId ? 'service:' + serviceId : ''
  const [query, setQuery] = useState(initialQuery)
  const [hours, setHours] = useState<TelemetryHours>(6)
  const [applied, setApplied] = useState({ query: initialQuery, hours: 6 as TelemetryHours })
  const validated = parseLogQuery(applied.query)
  const logs = validated ? filterLogs(demoLogs, validated, applied.hours, demoWorkspace.snapshotAt) : []
  const metricsService = validated?.service ?? paymentService.serviceId
  const showMetrics = demo !== 'no-metrics' && metricsService === paymentService.serviceId
  const loading = demo === 'loading'
  const failed = demo === 'error'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({ query, hours })
  }

  return (
    <div className="logs-metrics-page">
      <div className="telemetry-hero">
        <h1 className="page-title">Logs &amp; metrics</h1>
        <p>Query and inspect indexed logs alongside application and system metrics</p>
      </div>

      <Panel className="log-query__source">
        <span>SOURCE&nbsp; Elasticsearch · Demo</span>
        <div role="tablist" aria-label="Query view">
          <button type="button" className="log-query__mode" role="tab" id={logsTabId}
            aria-selected="true" aria-controls={logsPanelId}>Logs</button>
        </div>
      </Panel>

      <div role="tabpanel" id={logsPanelId} aria-labelledby={logsTabId}>
        <Panel className="log-query telemetry-query">
          <form onSubmit={handleSubmit} className="log-query__form">
            <TextInput label="Log query" name="query" value={query}
              placeholder='service:payment-service level:ERROR keyword:"timeout"'
              aria-describedby="log-query-help" aria-invalid={!validated && applied.query === query}
              onChange={(event) => setQuery(event.currentTarget.value)} />
            <Select label="Time range" name="hours" value={hours}
              onChange={(event) => setHours(readTelemetryHours(event.currentTarget.value, 6))}>
              {telemetryRanges.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </Select>
            <Button type="submit" disabled={loading || failed}>Run query</Button>
          </form>
          <p className="log-query__help" id="log-query-help">{queryHelp}</p>
        </Panel>

        <div className="log-panels telemetry-panels">
          <Panel title="Log results" meta={loading || failed || !validated ? undefined : logs.length + (logs.length === 1 ? ' match' : ' matches')} className="log-results">
            <div id="log-results" tabIndex={-1}>
              {loading ? <LoadingState title="Loading demo logs…" />
                : failed ? <ErrorState title="Logs unavailable" description="The local demo log fixture could not be loaded."
                  action={<Link className="text-link" to={paths.logsMetrics}>Open default demo</Link>} />
                : !validated ? <ErrorState title="Unsupported demo query" description={queryHelp} />
                : logs.length === 0 ? <EmptyState title="No matching logs" description="Change the query or increase the time range." />
                : <ul className="log-records">{logs.map((entry) => <LogRecord key={entry.logId} entry={entry} />)}</ul>}
            </div>
          </Panel>

          <Panel title="Metrics / Prometheus" meta="Last 6h" className="log-metrics">
            {showMetrics ? (
              <>
                <p className="log-metrics__snapshot">
                  <code>{metricsService}</code> · snapshot <CaseTime at={demoWorkspace.snapshotAt} />
                </p>
                <ul className="log-gauges">
                  {paymentMetrics.map(({ label, value, max, unit, tone }) => (
                    <li key={label} className={'log-gauge tone--' + tone}>
                      <div><span>{label}</span><strong>{value}{unit === '%' ? '%' : ' ' + unit}</strong></div>
                      <meter min={0} max={max} value={value} aria-label={label}
                        aria-valuetext={value + ' ' + unit + ' on a 0 to ' + max + ' ' + unit + ' scale'} />
                      <small>Scale 0–{max} {unit}</small>
                    </li>
                  ))}
                </ul>
              </>
            ) : <EmptyState title="No metric data" description={'No Prometheus snapshot for ' + metricsService + '.'} />}
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function LogsMetricsPage() {
  const [params] = useSearchParams()
  const serviceId = params.get('serviceId') ?? ''
  const demo = params.get('demo')
  return <LogsExplorer key={serviceId + '|' + demo} serviceId={serviceId} demo={demo} />
}
