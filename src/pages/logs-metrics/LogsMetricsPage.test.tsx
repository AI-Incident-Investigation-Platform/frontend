// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { LogsMetricsPage } from './LogsMetricsPage'

it('selects the Logs tab and runs the query in its labelled panel', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  try {
    await act(() => root.render(
      <MemoryRouter initialEntries={['/logs-metrics?serviceId=payment-service']}>
        <LogsMetricsPage />
      </MemoryRouter>,
    ))

    const tab = container.querySelector<HTMLButtonElement>('[role="tablist"] button[role="tab"]')
    const panel = container.querySelector('[role="tabpanel"]')
    expect(tab?.textContent).toBe('Logs')
    expect(tab?.getAttribute('aria-selected')).toBe('true')
    expect(tab?.getAttribute('aria-controls')).toBe(panel?.id)
    expect(panel?.getAttribute('aria-labelledby')).toBe(tab?.id)

    const query = panel?.querySelector<HTMLInputElement>('input[name="query"]')
    expect(query?.value).toBe('service:payment-service')
    if (!query) throw new Error('Missing query inside the Logs tab panel')

    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    await act(() => {
      setValue?.call(query, 'service:payment-service level:ERROR keyword:"connection timeout"')
      query.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(() => panel?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click())
    expect(panel?.querySelectorAll('.log-row')).toHaveLength(1)
    expect(panel?.textContent).toContain('PostgreSQL connection timeout')
    expect(container.textContent).toContain('12.8%')
  } finally {
    await act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  }
})
