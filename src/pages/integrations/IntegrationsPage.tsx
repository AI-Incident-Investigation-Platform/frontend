import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '../../app/navigation'
import type { Integration, IntegrationProvider, IntegrationValues } from '../../entities/administration'
import { IntegrationEditor } from '../../features/integration-editor/IntegrationEditor'
import { integrationProviders } from '../../features/integration-editor/providerFields'
import { type IntegrationDemo, type IntegrationSessions } from '../../mocks/administration'
import { demoWorkspace } from '../../mocks/investigation'
import { StatusBadge } from '../../shared/ui/badges'
import { Button } from '../../shared/ui/controls'
import { EmptyState, ErrorState, LoadingState, Panel } from '../../shared/ui/surfaces'
import './integrations.css'

type IntegrationsProps = {
  sessions: IntegrationSessions
  onSave: (demo: IntegrationDemo, list: readonly Integration[]) => void
}

function IntegrationList({ list, mode, demo, onSave }: {
  list: readonly Integration[]
  mode: IntegrationDemo
  demo: string | null
  onSave: IntegrationsProps['onSave']
}) {
  const [editor, setEditor] = useState<{ integration?: Integration } | null>(null)
  const [notice, setNotice] = useState('')
  const loading = demo === 'loading'
  const failed = demo === 'error'

  function saveIntegration(provider: IntegrationProvider, values: IntegrationValues) {
    const previous = editor?.integration
    if (previous) {
      const changed = integrationProviders[provider].fields.some(({ key }) => previous.values[key] !== values[key])
      const updated: Integration = { ...previous, values, status: changed ? 'disconnected' : previous.status }
      onSave(mode, list.map((item) => item.id === previous.id ? updated : item))
      setNotice('Saved locally for this demo session.')
    } else {
      const entry: Integration = { id: provider + '-local-' + (list.length + 1), provider, status: 'disconnected', values }
      onSave(mode, [...list, entry])
      setNotice('Added locally for this demo session.')
    }
  }

  return (
    <div className="integrations-page">
      <div className="admin-hero integration-hero">
        <div>
          <h1 className="page-title">Integrations</h1>
          <p>Configure read-only telemetry and code sources for {demoWorkspace.project} · {demoWorkspace.environment}</p>
        </div>
        <Button data-add-integration aria-haspopup="dialog" className="admin-main-action" disabled={loading || failed}
          onClick={() => { setNotice(''); setEditor({}) }}>+ Add integration</Button>
      </div>

      {notice && <p className="admin-notice" role="status">{notice}</p>}
      <Panel title="Connected data sources" meta={loading || failed ? 'Demo statuses' : list.length + ' configured · Demo statuses'}
        className="admin-panel source-panel">
        {loading ? <LoadingState title="Loading demo integrations…" />
          : failed ? <ErrorState title="Integrations unavailable" description="The local integration fixture could not be loaded."
            action={<Link to={paths.integrations} className="text-link">Open default demo</Link>} />
          : list.length === 0 ? <EmptyState title="No integrations configured"
            description="Add a source to see its settings in this demo."
            action={<Button aria-haspopup="dialog" onClick={() => setEditor({})}>+ Add integration</Button>} />
          : <ul className="source-list">{list.map((integration) => {
            const { name, description, monogram, fields } = integrationProviders[integration.provider]
            return (
              <li key={integration.id} className="source-row">
                <div className="source-row__identity">
                  <span className="source-monogram" aria-hidden="true">{monogram}</span>
                  <div><h3>{name}</h3><p>{description}</p></div>
                </div>
                <code className="source-row__configuration">{integration.values[fields[0].key]}</code>
                <StatusBadge status={integration.status} />
                <Button className="source-configure" aria-label={'Configure ' + name} aria-haspopup="dialog"
                  onClick={() => { setNotice(''); setEditor({ integration }) }}>Configure <span aria-hidden="true">→</span></Button>
              </li>
            )
          })}</ul>}
      </Panel>
      {editor && <IntegrationEditor integration={editor.integration} onDismiss={() => setEditor(null)} onSave={saveIntegration} />}
    </div>
  )
}

export function IntegrationsPage({ sessions, onSave }: IntegrationsProps) {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const mode = demo === 'long' || demo === 'empty' ? demo : 'default'
  return <IntegrationList key={demo} list={sessions[mode]} mode={mode} demo={demo} onSave={onSave} />
}
