import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { IncidentsPage } from './pages/incidents/IncidentsPage'
import { navigationGroups, paths } from './app/navigation'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { IncidentDetailPage } from './pages/incident-detail/IncidentDetailPage'
import { LiveInvestigationsPage } from './pages/investigations/LiveInvestigationsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OverviewPage } from './pages/overview/OverviewPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={paths.overview} replace />} />
      <Route element={<AppShell />}>
        <Route path={paths.incidents} element={<IncidentsPage />} />
        <Route path={paths.investigations} element={<LiveInvestigationsPage />} />
        {navigationGroups.flatMap(({ items }) => items)
          .filter(({ path }) => path !== paths.incidents && path !== paths.investigations).map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={item.path === paths.overview
              ? <OverviewPage />
              : <PlaceholderPage title={item.title} story={item.story} />}
          />
        ))}
        <Route path={paths.incidentDetail} element={<IncidentDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
