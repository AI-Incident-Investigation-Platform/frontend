import { useId, type KeyboardEvent, type ReactNode } from 'react'

type Tab = { id: string; label: string; content: ReactNode }

type TabsProps = {
  label: string
  tabs: readonly Tab[]
  value: string
  onChange: (id: string) => void
}

export function Tabs({ label, tabs, value, onChange }: TabsProps) {
  const baseId = useId()
  const activeId = tabs.find(({ id }) => id === value)?.id ?? tabs[0]?.id
  const tabId = (id: string) => `${baseId}-tab-${id}`
  const panelId = (id: string) => `${baseId}-panel-${id}`

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const current = buttons.findIndex((button) => button === event.target)
    if (current === -1) return

    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (current + 1) % buttons.length
        break
      case 'ArrowLeft':
        next = (current + buttons.length - 1) % buttons.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = buttons.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    onChange(tabs[next].id)
    buttons[next].focus()
  }

  if (!tabs.length) return null

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
        {tabs.map(({ id, label: tabLabel }) => (
          <button
            type="button"
            role="tab"
            key={id}
            id={tabId(id)}
            aria-controls={panelId(id)}
            aria-selected={id === activeId}
            tabIndex={id === activeId ? 0 : -1}
            onClick={() => onChange(id)}
          >
            {tabLabel}
          </button>
        ))}
      </div>
      {tabs.map(({ id, content }) => (
        <div
          key={id}
          id={panelId(id)}
          role="tabpanel"
          aria-labelledby={tabId(id)}
          hidden={id !== activeId}
          tabIndex={0}
          className="tabs__panel"
        >
          {id === activeId && content}
        </div>
      ))}
    </div>
  )
}
