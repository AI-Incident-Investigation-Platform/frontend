import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { navigationGroups, paths } from './app/navigation'
import { IncidentPlaceholderPage, PlaceholderPage } from './pages/PlaceholderPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={paths.overview} replace />} />
      <Route element={<AppShell />}>
        {navigationGroups.flatMap(({ items }) => items).map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={<PlaceholderPage title={item.title} story={item.story} />}
          />
        ))}
        <Route path={paths.incidentDetail} element={<IncidentPlaceholderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
