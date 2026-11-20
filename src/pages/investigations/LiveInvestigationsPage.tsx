import { generatePath, Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import { formatToolDuration, summarizeRuns, type RunActivity } from '../../features/run-viewer/projectRuns'
import { getDemoIncidents } from '../../mocks/incidents'
import { paymentRun } from '../../mocks/investigation'
import { readDemoRuns, readRunScenario, runScenarios } from '../../mocks/runs'
import { StatusBadge } from '../../shared/ui/badges'
import { Select } from '../../shared/ui/controls'
import { EmptyState, MetricCard, Panel } from '../../shared/ui/surfaces'
import { CaseTime, formatUtcTime } from '../incident-detail/presentation'
import './investigations.css'

const incidentServices = new Map(getDemoIncidents(null).map(({ incidentId, serviceId }) => [incidentId, serviceId]))

function steps({ run }: RunActivity) {
  return run.currentStep + ' / ' + run.totalSteps
}

function ToolActivity({ activity, incidentHref }: { activity: RunActivity; incidentHref: string }) {
  const { run, events } = activity

  return (
    <Panel title="Live Tool Activity" meta={'STEP ' + steps(activity)}>
      <div className="run-context">
        <div>
          <code>{run.runId}</code>
          <StatusBadge status={run.status} />
        </div>
        <Link className="text-link" to={incidentHref}>Open {run.incidentId}</Link>
      </div>
      <progress className="visually-hidden" max={Math.max(1, run.totalSteps)} value={run.currentStep}
        aria-label="Run progress" aria-valuetext={steps(activity) + ' steps'} />
      {events.length === 0 ? <EmptyState title="Waiting for the first tool call" /> : (
        <ol className="run-events" aria-label={'Tool calls for ' + run.runId}>
          {events.map((event) => {
            const duration = formatToolDuration(event.durationMs)
            return (
              <li key={event.eventId} className={'run-event run-event--' + event.status}>
                <span className="run-event__dot" aria-hidden="true" />
                <CaseTime at={event.timestamp} precise />
                <div className="run-event__body">
                  <div className="run-event__heading">
                    <strong>{event.tool}</strong>
                    <div className="run-event__status">
                      {duration && <code>{duration}</code>}
                      <StatusBadge status={event.status} />
                    </div>
                  </div>
                  <p>{event.summary}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}

export function LiveInvestigationsPage() {
  const [params, setParams] = useSearchParams()
  const scenario = readRunScenario(params.get('demo'))
  const { activities, snapshotAt } = readDemoRuns(scenario)
  const selected = activities.find(({ run }) => run.runId === params.get('run')) ?? activities[0]
  const running = activities.find(({ run }) => run.status === 'running')
  const counts = summarizeRuns(activities, snapshotAt)
  const incidentParams = new URLSearchParams({ tab: 'live' })

  if (selected?.run.runId === paymentRun.runId && scenario !== 'running') {
    incidentParams.set('demo', scenario)
  }

  return (
    <div className="live-investigations">
      <div className="run-hero">
        <div>
          <h1 className="page-title">Live investigations</h1>
          <p className="run-description">Active and historical agent executions with tool-by-tool progress</p>
        </div>
        <Select label="Demo scenario" name="demo" value={scenario} onChange={(event) => {
          const next = new URLSearchParams(params)
          const value = event.currentTarget.value
          if (value === 'running') next.delete('demo')
          else next.set('demo', value)
          next.delete('run')
          setParams(next, { preventScrollReset: true })
        }}>
          {runScenarios.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </Select>
      </div>

      <section className="run-metrics" aria-label="Investigation metrics">
        <MetricCard label="Running" value={String(counts.running).padStart(2, '0')} tone="info"
          hint={running ? running.run.incidentId + ' · Step ' + steps(running) : 'No live runs'} />
        <MetricCard label="Awaiting review" value={String(counts.awaitingReview).padStart(2, '0')} tone="warning"
          hint={counts.awaitingReview ? 'Human review required' : 'Review queue empty'} />
        <MetricCard label="Completed / 24h" value={String(counts.completed24h).padStart(2, '0')} tone="success"
          hint={'Through ' + formatUtcTime(snapshotAt) + ' UTC'} />
      </section>

      <p className="visually-hidden" role="status">
        {selected && <>{selected.run.incidentId} · <StatusBadge status={selected.run.status} /> · Step {steps(selected)}</>}
      </p>

      <div className="run-grid">
        <Panel title="Recent Agent Runs" meta={activities.length + ' runs'}>
          {activities.length ? (
            <ul className="run-list">
              {activities.map((activity) => {
                const { run } = activity
                return (
                  <li key={run.runId}>
                    <button type="button" className="run-select" aria-pressed={run.runId === selected?.run.runId}
                      onClick={() => {
                        if (run.runId === selected?.run.runId) return
                        const next = new URLSearchParams(params)
                        next.set('run', run.runId)
                        setParams(next, { preventScrollReset: true })
                      }}>
                      <span className="run-select__top">
                        <strong>{run.incidentId}</strong>
                        <StatusBadge status={run.status} />
                      </span>
                      <code className="run-select__service">{incidentServices.get(run.incidentId)}</code>
                      <span className="run-select__meta"><CaseTime at={run.startedAt} includeDate /><span>Step {steps(activity)}</span></span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState title="No agent runs" description="Select another demo scenario to see recorded activity." />}
        </Panel>

        {selected ? <ToolActivity activity={selected}
          incidentHref={generatePath(paths.incidentDetail, { incidentId: selected.run.incidentId }) + '?' + incidentParams}
        /> : <Panel title="Live Tool Activity"><EmptyState title="No tool activity" /></Panel>}
      </div>
    </div>
  )
}
