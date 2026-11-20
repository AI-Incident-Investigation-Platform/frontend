import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { IncidentsPage } from './pages/incidents/IncidentsPage'
import { paths } from './app/navigation'
import { defaultWorkspaceSettings, integrationDemos, type IntegrationSessions } from './mocks/administration'
import { IncidentDetailPage } from './pages/incident-detail/IncidentDetailPage'
import { IntegrationsPage } from './pages/integrations/IntegrationsPage'
import { LiveInvestigationsPage } from './pages/investigations/LiveInvestigationsPage'
import { LogsMetricsPage } from './pages/logs-metrics/LogsMetricsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OverviewPage } from './pages/overview/OverviewPage'
import { ServiceMapPage } from './pages/service-map/ServiceMapPage'
import { TracesPage } from './pages/traces/TracesPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import './shared/styles/administration.css'
import './shared/styles/telemetry.css'

export function App() {
  const [integrationSessions, setIntegrationSessions] = useState<IntegrationSessions>(integrationDemos)
  const [workspaceSettings, setWorkspaceSettings] = useState(defaultWorkspaceSettings)

  return (
    <Routes>
      <Route path="/" element={<Navigate to={paths.overview} replace />} />
      <Route element={<AppShell />}>
        <Route path={paths.incidents} element={<IncidentsPage />} />
        <Route path={paths.investigations} element={<LiveInvestigationsPage />} />
        <Route path={paths.serviceMap} element={<ServiceMapPage />} />
        <Route path={paths.logsMetrics} element={<LogsMetricsPage />} />
        <Route path={paths.traces} element={<TracesPage />} />
        <Route path={paths.overview} element={<OverviewPage />} />
        <Route path={paths.integrations} element={<IntegrationsPage sessions={integrationSessions}
          onSave={(demo, list) => setIntegrationSessions((current) => ({ ...current, [demo]: list }))} />} />
        <Route path={paths.settings} element={<SettingsPage value={workspaceSettings} onSave={setWorkspaceSettings} />} />
        <Route path={paths.incidentDetail} element={<IncidentDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
