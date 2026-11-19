import type { Evidence, Incident, RcaReport } from '../../entities/investigation'
import { demoWorkspace } from '../../mocks/investigation'
import type { IncidentInvestigation } from '../../mocks/incidentDetail'
import { StatusBadge } from '../../shared/ui/badges'
import { Button } from '../../shared/ui/controls'
import { EmptyState, ErrorState, Panel } from '../../shared/ui/surfaces'
import { CaseTime, EvidenceLinks, formatUtcTime, type EvidenceHref } from './presentation'

type EvidenceProps = { investigation?: IncidentInvestigation; href: EvidenceHref }

function duration(ms: number | null) {
  if (ms === null) return null
  return ms < 1000 ? ms + ' ms' : Number((ms / 1000).toFixed(2)) + ' s'
}

export function OverviewPanel({ incident, investigation }: { incident: Incident; investigation?: IncidentInvestigation }) {
  const impact = investigation?.impact
  const report = investigation?.rca

  return (
    <div className="detail-columns">
      <Panel title="Impact & symptoms">
        <div className="detail-pad">
          <p>{impact?.description ?? incident.title}</p>
          <dl className="detail-fields">
            <div><dt>Affected service</dt><dd><code>{incident.serviceId}</code></dd></div>
            <div><dt>Incident status</dt><dd><StatusBadge status={incident.status} /></dd></div>
            <div>
              <dt>{impact ? 'Observation window' : 'Detected'}</dt>
              <dd>{impact && <>{formatUtcTime(impact.firstObservedAt)}–</>}
                <CaseTime at={impact ? demoWorkspace.snapshotAt : incident.detectedAt} includeDate={!impact} /></dd>
            </div>
          </dl>
          {impact && <ul className="detail-bullets">{impact.symptoms.map((symptom) => <li key={symptom}>{symptom}</li>)}</ul>}
        </div>
      </Panel>
      <Panel title="RCA status">
        {report && report.status !== 'pending' ? (
          <div className="detail-pad"><StatusBadge status={report.reviewStatus} /><p>{report.summary}</p></div>
        ) : <EmptyState title="RCA pending" description="Findings appear after the investigation produces a report." />}
      </Panel>
    </div>
  )
}

export function LiveInvestigationPanel({ investigation, href }: EvidenceProps) {
  if (!investigation) {
    return <Panel title="Live investigation"><EmptyState title="No investigation run recorded" /></Panel>
  }
  const { run, tools, hypotheses, evidence, failure } = investigation
  const previewEvidence = evidence.filter(({ source }) => source.kind !== 'trace').slice(0, 3)

  return (
    <div className="detail-columns detail-live-panels">
      <Panel title="Live investigation" meta={run.currentStep + ' / ' + run.totalSteps + ' steps'}>
        <progress className="visually-hidden" max={run.totalSteps} value={run.currentStep} aria-label="Investigation progress" />
        <div className="detail-run">
          <code>{run.runId}</code>
          <StatusBadge status={run.status} />
        </div>
        {failure && <ErrorState title="Investigation failed" description={failure} />}
        <ol className="detail-rows detail-tools">
          {tools.map((event) => {
            const elapsed = duration(event.durationMs)
            return (
              <li key={event.eventId}>
                <div className="detail-tool-heading">
                  <span className={'detail-dot detail-dot--' + event.status} aria-hidden="true" />
                  <CaseTime at={event.timestamp} />
                  <strong>{event.tool}</strong>
                  <span className="detail-tool-status">
                    {elapsed && <code>{elapsed}</code>}
                    <StatusBadge status={event.status} />
                  </span>
                </div>
                <p>{event.summary}</p>
              </li>
            )
          })}
        </ol>
      </Panel>
      <Panel title="Hypotheses & evidence" meta={hypotheses.length + ' hypotheses'}>
        {hypotheses.length ? (
          <ol className="detail-rows detail-preview">
            {hypotheses.map((hypothesis, index) => (
              <li key={hypothesis.hypothesisId}>
                <p><code>{String(index + 1).padStart(2, '0')}</code> {hypothesis.title}</p>
                <StatusBadge status={hypothesis.status} />
              </li>
            ))}
          </ol>
        ) : <EmptyState title="No hypotheses available" />}
        {previewEvidence.length > 0 && <div className="detail-preview-links">
          <h3>Evidence links</h3>
          <EvidenceLinks evidence={previewEvidence} href={href} />
        </div>}
      </Panel>
    </div>
  )
}

export function HypothesesPanel({ investigation, href }: EvidenceProps) {
  const hypotheses = investigation?.hypotheses ?? []
  const evidence = investigation?.evidence ?? []
  return (
    <Panel title="Hypotheses" meta={hypotheses.length + ' hypotheses'}>
      {hypotheses.length ? (
        <ol className="detail-rows">
          {hypotheses.map(({ hypothesisId, title, explanation, status, evidenceIds }) => (
            <li key={hypothesisId}>
              <div className="detail-row-heading"><h3>{title}</h3><StatusBadge status={status} /></div>
              <p>{explanation}</p>
              <EvidenceLinks href={href} evidence={evidence.filter(({ evidenceId }) => evidenceIds.includes(evidenceId))} />
            </li>
          ))}
        </ol>
      ) : <EmptyState title="No hypotheses available" />}
    </Panel>
  )
}

export function TimelinePanel({ incident, investigation }: { incident: Incident; investigation?: IncidentInvestigation }) {
  const timeline = investigation?.timeline ?? [{
    id: incident.incidentId, source: 'Incident', timestamp: incident.detectedAt,
    title: 'Incident detected', summary: incident.title,
  }]
  return (
    <Panel title="Timeline" meta="UTC">
      <ol className="detail-rows">
        {timeline.map(({ id, source, timestamp, title, summary }) => (
          <li key={id}>
            <div className="detail-row-heading"><h3>{title}</h3><CaseTime at={timestamp} precise includeDate={!investigation} /></div>
            <p><strong>{source}</strong> · {summary}</p>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

type RcaProps = {
  report?: RcaReport
  evidence: readonly Evidence[]
  href: EvidenceHref
  canReview: boolean
  onReview: (decision: 'approved' | 'rejected') => void
}

export function RcaPanel({ report, evidence, href, canReview, onReview }: RcaProps) {
  if (!report || report.status === 'pending') {
    return <Panel title="RCA report"><EmptyState title="RCA pending" description="Findings appear after the investigation produces a report." /></Panel>
  }

  return (
    <Panel title="RCA report" meta={report.status === 'reviewed' ? 'Reviewed' : 'Ready'}>
      <div className="detail-pad detail-rca">
        <div className="detail-row-heading">
          <h3>Human review</h3>
          <StatusBadge status={report.reviewStatus} />
        </div>
        {report.status === 'reviewed' && <p>Reviewed at <CaseTime at={report.reviewedAt} /></p>}
        <p>{report.summary}</p>
        <section>
          <h3>Probable root cause</h3>
          <p>{report.rootCause}</p>
        </section>
        <section>
          <h3>Evidence references</h3>
          <EvidenceLinks href={href} evidence={evidence.filter(({ evidenceId }) => report.evidenceIds.includes(evidenceId))} />
        </section>
        <section>
          <h3>Recommendations</h3>
          <ul className="detail-bullets">{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>Unknowns</h3>
          <ul className="detail-bullets">{report.unknowns.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        {report.reviewStatus === 'awaiting-review' && (
          canReview ? <div className="detail-review-actions">
            <Button onClick={() => onReview('approved')}>Approve</Button>
            <Button onClick={() => onReview('rejected')}>Reject</Button>
            <span>Demo review</span>
          </div> : <p className="detail-muted">Review is available to demo Admins.</p>
        )}
      </div>
    </Panel>
  )
}
