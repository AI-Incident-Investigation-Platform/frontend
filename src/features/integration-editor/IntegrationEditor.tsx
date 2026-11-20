import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Integration, IntegrationProvider, IntegrationValues } from '../../entities/administration'
import { Button, Select, TextInput } from '../../shared/ui/controls'
import { integrationProviders, providerIds, validateIntegration } from './providerFields'

type Props = {
  integration?: Integration
  onDismiss: () => void
  onSave: (provider: IntegrationProvider, values: IntegrationValues) => void
}

export function IntegrationEditor({ integration, onDismiss, onSave }: Props) {
  const [provider, setProvider] = useState<IntegrationProvider>(integration?.provider ?? providerIds[0])
  const [draft, setDraft] = useState<IntegrationValues>(integration?.values ?? {})
  const [errors, setErrors] = useState<IntegrationValues>({})
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  const help = useId()
  const definition = integrationProviders[provider]

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
  }, [])

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateIntegration(provider, draft)
    setErrors(result.errors)
    const firstError = definition.fields.find(({ key }) => result.errors[key])
    if (firstError) {
      const field = event.currentTarget.elements.namedItem(firstError.key)
      if (field instanceof HTMLElement) field.focus()
      return
    }
    onSave(provider, result.values)
    dialog.current?.close()
  }

  return (
    <dialog className="integration-editor" aria-labelledby={title} aria-describedby={help} ref={dialog} onClose={onDismiss}>
      <div className="integration-editor__heading">
        <h2 id={title}>{integration ? 'Configure ' + definition.name : 'Add integration'}</h2>
        <span className="admin-mode">Demo</span>
      </div>
      <p id={help}>Use sample values. Changes apply only to this demo session.</p>
      <form noValidate onSubmit={save} onReset={(event) => {
        event.preventDefault()
        setDraft(integration?.values ?? {})
        setErrors({})
      }}>
        {!integration && <Select name="provider" label="Provider" value={provider} onChange={(event) => {
          const next = providerIds.find((id) => id === event.currentTarget.value)
          if (!next) return
          setProvider(next)
          setDraft({})
          setErrors({})
        }}>
          {providerIds.map((id) => <option key={id} value={id}>{integrationProviders[id].name}</option>)}
        </Select>}
        {definition.fields.map(({ key, label, placeholder }) => (
          <div className="admin-field" key={key}>
            <TextInput id={title + '-' + key} name={key} label={label} placeholder={placeholder}
              type={key === 'endpoint' ? 'url' : 'text'} autoComplete="off" spellCheck={false} required
              aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? title + '-' + key + '-error' : undefined}
              value={draft[key] ?? ''} onChange={(event) => {
                setDraft({ ...draft, [key]: event.currentTarget.value })
                if (errors[key]) setErrors({ ...errors, [key]: undefined })
              }} />
            {errors[key] && <p className="admin-field-error" id={title + '-' + key + '-error'} role="alert">{errors[key]}</p>}
          </div>
        ))}
        <div className="admin-actions">
          <Button data-cancel onClick={() => dialog.current?.close()}>Cancel</Button>
          <Button type="reset">Reset</Button>
          <Button type="submit" variant="primary">Save (demo)</Button>
        </div>
      </form>
    </dialog>
  )
}
