import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { RegistryIncident } from '../../features/incident-filters/filters'
import { readIncidentInvestigation } from '../../mocks/incidentDetail'
import { getDemoIncidents } from '../../mocks/incidents'
import { demoWorkspace } from '../../mocks/investigation'
import { findRecordedRun } from '../../mocks/runs'
import { topologyServices } from '../../mocks/telemetry'
import { SeverityBadge, StatusBadge } from '../../shared/ui/badges'
import { Button } from '../../shared/ui/controls'
import { Panel } from '../../shared/ui/surfaces'
import { Tabs } from '../../shared/ui/Tabs'
import { EvidencePanel } from './EvidencePanel'
import { HypothesesPanel, LiveInvestigationPanel, OverviewPanel, RcaPanel, TimelinePanel } from './InvestigationPanels'
import { CaseTime, formatUtcDateTime, formatUtcTime } from './presentation'
import './incident-detail.css'

const actionMessages = {
  running: 'Demo: running snapshot loaded.',
  cancelled: 'Demo: cancelled snapshot loaded.',
  approved: 'Demo: approval snapshot loaded.',
  rejected: 'Demo: rejection snapshot loaded.',
} as const

function IncidentWorkspace({ incident }: { incident: RegistryIncident }) {
  const [params, setParams] = useSearchParams()
  const [message, setMessage] = useState('')
  const scenario = params.get('demo')
  const investigation = readIncidentInvestigation(incident.incidentId, scenario)
  const recordedRun = findRecordedRun(incident.incidentId, scenario)
  const roleParam = params.get('role')
  const role = roleParam === 'viewer' ? 'Viewer' : roleParam === 'admin' ? 'Admin' : 'Developer'
  const status = investigation?.run.status
  const canRetry = status === 'failed' || status === 'cancelled'
  const canCancel = status === 'running' || status === 'pending'
  const detected = investigation ? formatUtcTime(incident.detectedAt) : formatUtcDateTime(incident.detectedAt)

  function evidenceHref(id: string) {
    const next = new URLSearchParams(params)
    next.set('tab', 'evidence')
    next.set('evidence', id)
    return '?' + next.toString()
  }

  function changeTab(id: string) {
    if (id === activeTab) return
    const next = new URLSearchParams(params)
    next.set('tab', id)
    next.delete('evidence')
    setParams(next, { preventScrollReset: true })
  }

  function showScenario(nextScenario: keyof typeof actionMessages) {
    const next = new URLSearchParams(params)
    if (nextScenario === 'running') next.delete('demo')
    else next.set('demo', nextScenario)
    setParams(next, { preventScrollReset: true })
    setMessage(actionMessages[nextScenario])
  }

  const tabs = [
    { id: 'overview', label: 'Overview', content: <OverviewPanel incident={incident} investigation={investigation} /> },
    { id: 'live', label: 'Live investigation',
      content: <LiveInvestigationPanel investigation={investigation} recordedRun={recordedRun} href={evidenceHref} /> },
    { id: 'hypotheses', label: 'Hypotheses', content: <HypothesesPanel investigation={investigation} href={evidenceHref} /> },
    { id: 'evidence', label: 'Evidence', content: <EvidencePanel evidence={investigation?.evidence ?? []}
      hypotheses={investigation?.hypotheses ?? []} selectedId={params.get('evidence')} href={evidenceHref} /> },
    { id: 'timeline', label: 'Timeline', content: <TimelinePanel incident={incident} investigation={investigation} /> },
    { id: 'rca', label: 'RCA report', content: <RcaPanel report={investigation?.rca} evidence={investigation?.evidence ?? []}
      href={evidenceHref} canReview={role === 'Admin'} onReview={showScenario} /> },
  ]
  const activeTab = tabs.find(({ id }) => id === params.get('tab'))?.id ?? (investigation ? 'live' : 'overview')

  return (
    <div className="incident-detail">
      <div className="detail-hero">
        <div>
          <h1 className="page-title">{incident.incidentId} / {incident.serviceId}</h1>
          <p className="detail-subtitle">Root cause investigation, evidence and timeline</p>
        </div>
        <div className="detail-hero-side">
          <div className="detail-actions">
            <StatusBadge status={incident.status} />
            <SeverityBadge severity={incident.severity} />
            {investigation && role !== 'Viewer' && <>
              <Button disabled={!canRetry} title={canRetry ? 'Load the demo running snapshot' : 'Retry is available after a failed or cancelled run'}
                onClick={() => showScenario('running')}>Retry</Button>
              <Button disabled={!canCancel} title={canCancel ? 'Load the demo cancelled snapshot' : 'Cancel is available during an active run'}
                onClick={() => showScenario('cancelled')}>Cancel</Button>
            </>}
          </div>
          <p className="detail-mode">Demo · {role}{role === 'Viewer' ? ' · Read-only' : ''}</p>
        </div>
      </div>
      {message && <p className="detail-feedback" role="status">{message}</p>}

      <Panel title="Incident summary" meta={'Detected ' + detected + ' UTC'} className="detail-summary">
        <div className="detail-summary-body">
          <h3>{incident.title}</h3>
          {investigation && <p>{investigation.impact.description}</p>}
          <ul className="detail-context">
            <li>{topologyServices.some(({ serviceId }) => serviceId === incident.serviceId)
              ? <Link className="text-link" to={paths.serviceMap + '?' + new URLSearchParams({ serviceId: incident.serviceId })}>
                {incident.serviceId} on Service Map
              </Link>
              : incident.serviceId}</li>
            <li>{incident.project}</li>
            <li>{demoWorkspace.environment}</li>
            {investigation
              ? <li>First observed <CaseTime at={investigation.impact.firstObservedAt} /></li>
              : <li>Detected <CaseTime at={incident.detectedAt} includeDate /></li>}
          </ul>
        </div>
      </Panel>

      <Tabs label="Incident investigation" tabs={tabs} value={activeTab} onChange={changeTab} />
    </div>
  )
}

export function IncidentDetailPage() {
  const { incidentId } = useParams()
  const incident = getDemoIncidents('long').find((record) => record.incidentId === incidentId)

  if (!incident) {
    return (
      <div className="incident-detail">
        <h1 className="page-title">Incident not found</h1>
        <p className="page-description">Choose an incident from the registry.</p>
        <Link className="text-link" to={paths.incidents}>Back to Incidents</Link>
      </div>
    )
  }

  return <IncidentWorkspace key={incident.incidentId} incident={incident} />
}
