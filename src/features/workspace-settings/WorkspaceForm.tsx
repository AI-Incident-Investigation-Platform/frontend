import { useId, useState, type FormEvent } from 'react'
import { demoRoles, workspaceEnvironments, type DemoRole, type WorkspaceSettings } from '../../entities/administration'
import { investigationLimits, workspaceProjects } from '../../mocks/administration'
import { Button, Select, TextInput } from '../../shared/ui/controls'
import { retentionRange, validateWorkspace, workspaceDraft, type WorkspaceDraft, type WorkspaceErrors } from './workspaceValidation'

export function WorkspaceForm({ value, role, onSave }: {
  value: WorkspaceSettings
  role: DemoRole
  onSave: (settings: WorkspaceSettings) => void
}) {
  const [draft, setDraft] = useState(() => workspaceDraft(value))
  const [errors, setErrors] = useState<WorkspaceErrors>({})
  const [notice, setNotice] = useState('')
  const id = useId()
  const canEdit = role === 'admin'

  function change<Field extends keyof WorkspaceDraft>(key: Field, text: WorkspaceDraft[Field]) {
    setDraft({ ...draft, [key]: text })
    setErrors({ ...errors, [key]: undefined })
    setNotice('')
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canEdit) return
    const result = validateWorkspace(draft, workspaceProjects)
    setErrors(result.errors)
    const firstInvalid = Object.keys(result.errors)[0]
    if (firstInvalid) {
      const field = event.currentTarget.elements.namedItem(firstInvalid)
      if (field instanceof HTMLElement) field.focus()
      return
    }
    onSave(result.settings)
    setDraft(workspaceDraft(result.settings))
    setNotice('Saved for this demo session.')
  }

  function fieldFeedback(key: keyof WorkspaceDraft) {
    const message = errors[key]
    return message ? <p className="admin-field-error" id={id + '-' + key} role="alert">{message}</p> : null
  }

  function fieldState(key: keyof WorkspaceDraft) {
    return { 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? id + '-' + key : undefined }
  }

  return (
    <form className="workspace-form" noValidate onSubmit={save} onReset={(event) => {
      event.preventDefault()
      setDraft(workspaceDraft(value))
      setErrors({})
      setNotice('')
    }}>
      <fieldset disabled={!canEdit} className="workspace-config">
        <legend>Workspace configuration</legend>
        <div className="workspace-row">
          <TextInput label="Workspace name" name="workspaceName" required autoComplete="off"
            value={draft.workspaceName} {...fieldState('workspaceName')}
            onChange={(event) => change('workspaceName', event.currentTarget.value)} />
          {fieldFeedback('workspaceName')}
        </div>
        <div className="workspace-row">
          <Select label="Default project" name="project" value={draft.project} {...fieldState('project')}
            onChange={(event) => change('project', event.currentTarget.value)}>
            {workspaceProjects.map((project) => <option key={project}>{project}</option>)}
          </Select>
          {fieldFeedback('project')}
        </div>
        <div className="workspace-row">
          <Select label="Default environment" name="environment" value={draft.environment} {...fieldState('environment')}
            onChange={(event) => {
              const next = workspaceEnvironments.find((environment) => environment === event.currentTarget.value)
              if (next) change('environment', next)
            }}>
            {workspaceEnvironments.map((environment) => <option key={environment}>{environment}</option>)}
          </Select>
          {fieldFeedback('environment')}
        </div>
        <div className="workspace-row">
          <TextInput label="Incident retention (days)" name="retentionDays" type="number" step={1} required
            min={retentionRange.min} max={retentionRange.max} value={draft.retentionDays} {...fieldState('retentionDays')}
            onChange={(event) => change('retentionDays', event.currentTarget.value)} />
          {fieldFeedback('retentionDays')}
        </div>
      </fieldset>

      <section className="settings-limits">
        <h3>Investigation settings</h3>
        <dl>
          <div><dt>Investigation timeout</dt><dd>{investigationLimits.timeoutMinutes} minutes</dd></div>
          <div><dt>Max tool calls</dt><dd>{investigationLimits.maxToolCalls}</dd></div>
          <div><dt>Agent execution steps</dt><dd>{investigationLimits.maxSteps}</dd></div>
        </dl>
      </section>

      {canEdit
        ? <div className="admin-actions workspace-actions">
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          <Button type="reset" title="Restore the last saved demo values">Reset</Button>
          <Button type="submit" className="admin-main-action">Save settings (demo)</Button>
        </div>
        : <p className="workspace-readonly">Workspace configuration is read-only for {demoRoles[role].label}.</p>}
    </form>
  )
}
