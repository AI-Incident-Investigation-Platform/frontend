import { useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { IncidentsPage } from './pages/incidents/IncidentsPage'
import { paths } from './app/navigation'
import { authDemoSearch, readAuthDemo, type AuthChallenge, type AuthDemo } from './features/auth/authModel'
import { defaultWorkspaceSettings, integrationDemos, type IntegrationSessions } from './mocks/administration'
import { AuthLayout } from './pages/auth/AuthLayout'
import { EmailOtpPage } from './pages/auth/EmailOtpPage'
import { LoginPage } from './pages/auth/LoginPage'
import { IncidentDetailPage } from './pages/incident-detail/IncidentDetailPage'
import { IntegrationsPage } from './pages/integrations/IntegrationsPage'
import { LiveInvestigationsPage } from './pages/investigations/LiveInvestigationsPage'
import { LogsMetricsPage } from './pages/logs-metrics/LogsMetricsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OverviewPage } from './pages/overview/OverviewPage'
import { ServiceMapPage } from './pages/service-map/ServiceMapPage'
import { TracesPage } from './pages/traces/TracesPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { createMockAuthAdapter } from './services/auth/mockAuthAdapter'
import './shared/styles/administration.css'
import './shared/styles/telemetry.css'

type AuthFlow =
  | { phase: 'challenge'; challenge: AuthChallenge; demo: AuthDemo }
  | { phase: 'verified' }

export function App() {
  const [integrationSessions, setIntegrationSessions] = useState<IntegrationSessions>(integrationDemos)
  const [workspaceSettings, setWorkspaceSettings] = useState(defaultWorkspaceSettings)
  const [authFlow, setAuthFlow] = useState<AuthFlow | null>(null)
  const loginFlow = authFlow?.phase === 'challenge' ? authFlow : null
  const location = useLocation()
  const navigate = useNavigate()
  const requestedDemo = readAuthDemo(new URLSearchParams(location.search).get('demo'))
  const demo = location.pathname === paths.login ? requestedDemo : loginFlow?.demo ?? requestedDemo
  const adapter = useMemo(() => createMockAuthAdapter(demo), [demo])
  const loginPath = paths.login + authDemoSearch(demo)
  const otpPath = paths.verifyEmailOtp + authDemoSearch(demo)

  return (
    <Routes>
      <Route path="/" element={<Navigate to={paths.overview} replace />} />
      <Route element={<AuthLayout />}>
        <Route path={paths.login} element={<LoginPage adapter={adapter} onChallenge={(challenge) => {
          setAuthFlow({ phase: 'challenge', challenge, demo })
          navigate(otpPath)
        }} />} />
        <Route path={paths.verifyEmailOtp} element={loginFlow
          ? <EmailOtpPage adapter={adapter} challenge={loginFlow.challenge} loginPath={loginPath}
            onChallenge={(challenge) => setAuthFlow({ phase: 'challenge', challenge, demo })}
            onAbandon={() => setAuthFlow(null)}
            onVerified={() => setAuthFlow({ phase: 'verified' })} />
          : <Navigate to={authFlow?.phase === 'verified' ? paths.overview : loginPath} replace />} />
      </Route>
      <Route element={loginFlow ? <Navigate to={otpPath} replace /> : <AppShell />}>
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
