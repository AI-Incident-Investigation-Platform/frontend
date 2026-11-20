import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import { demoRoles, readDemoRole, type DemoRole, type WorkspaceSettings } from '../../entities/administration'
import { WorkspaceForm } from '../../features/workspace-settings/WorkspaceForm'
import { demoRuntime } from '../../mocks/administration'
import { Select } from '../../shared/ui/controls'
import { EmptyState, ErrorState, LoadingState, Panel } from '../../shared/ui/surfaces'
import './settings.css'

const roles = Object.keys(demoRoles) as DemoRole[]

export function SettingsPage({ value, onSave }: { value: WorkspaceSettings; onSave: (settings: WorkspaceSettings) => void }) {
  const [params, setParams] = useSearchParams()
  const role = readDemoRole(params.get('role'), 'admin')
  const demo = params.get('demo')
  const defaultDemo = paths.settings + (role === 'admin' ? '' : '?' + new URLSearchParams({ role }))

  return (
    <div className="settings-page">
      <div className="admin-hero">
        <h1 className="page-title">Settings</h1>
        <p>Workspace preferences, project access, roles and incident behavior</p>
      </div>

      <div className="settings-grid">
        <Panel title="General settings" meta="Admin only" className="admin-panel settings-general">
          {demo === 'loading' ? <LoadingState title="Loading demo settings…" />
            : demo === 'empty' ? <EmptyState title="No workspace configured"
              description="The empty demo has no workspace settings."
              action={<Link className="text-link" to={defaultDemo}>Open default demo</Link>} />
            : demo === 'error' ? <ErrorState title="Settings unavailable" description="The local workspace fixture could not be loaded."
              action={<Link className="text-link" to={defaultDemo}>Open default demo</Link>} />
            : <WorkspaceForm key={role} role={role} value={value} onSave={onSave} />}
        </Panel>

        <div className="settings-side">
          <Panel title="Security and access" meta="Demo roles" className="admin-panel settings-access">
            <div className="settings-access__body">
              <Select label="Demo role" name="role" value={role} onChange={(event) => {
                const next = new URLSearchParams(params)
                next.set('role', event.currentTarget.value)
                setParams(next, { preventScrollReset: true })
              }}>
                {roles.map((id) => <option key={id} value={id}>{demoRoles[id].label}</option>)}
              </Select>
              <ul className="settings-role-list">
                {roles.map((id) => <li key={id}>
                  <strong>{demoRoles[id].label}</strong>
                  <p>{demoRoles[id].description}</p>
                </li>)}
              </ul>
            </div>
          </Panel>
          <Panel title="AI runtime" meta="Local · Read-only" className="admin-panel settings-runtime">
            <dl>
              <div><dt>Runtime</dt><dd><code>{demoRuntime.engine}</code></dd></div>
              <div><dt>Model</dt><dd><code>{demoRuntime.model}</code></dd></div>
              <div><dt>Execution</dt><dd>{demoRuntime.access}</dd></div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}
