// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

async function open(url = '/incidents/INC-1042') {
  window.history.replaceState(null, '', url)
  await act(() => root.render(<BrowserRouter><App /></BrowserRouter>))
}

function text() {
  return container.querySelector('main')?.textContent ?? ''
}

function button(label: string) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('main button'))
    .find((element) => element.textContent === label)
}

describe('Incident Detail', () => {
  it('renders six tabs, opens the deep link and preserves demo role when switching tabs', async () => {
    await open('/incidents/INC-1042?tab=timeline&role=viewer')
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(6)
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe('Timeline')
    expect(text()).toContain('Deployment')
    await act(() => button('Overview')?.click())
    expect(window.location.search).toBe('?tab=overview&role=viewer')
    expect(text()).toContain('RCA pending')
  })

  it('links a hypothesis to the matching Evidence source and excerpt', async () => {
    await open('/incidents/INC-1042?tab=hypotheses')
    const link = container.querySelector<HTMLAnchorElement>('main a[href*="evidence=EVD-1042-02"]')
    expect(link).not.toBeNull()
    await act(() => link?.click())
    expect(new URLSearchParams(window.location.search).get('tab')).toBe('evidence')
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe('Evidence')
    const detail = container.querySelector('[data-evidence-detail]')
    expect(detail?.textContent).toContain('EVD-1042-02')
    expect(detail?.textContent).toContain('Metric')
    expect(detail?.textContent).toContain('PostgreSQL connection leak')
  })

  it('uses the route record for another incident and offers recovery for an unknown ID', async () => {
    await open('/incidents/INC-1041')
    expect(container.querySelector('main h1')?.textContent).toBe('INC-1041 / order-service')
    expect(text()).toContain('Order processing p95 latency increased')
    expect(text()).not.toContain('PostgreSQL connection leak')
    await act(() => root.unmount())
    root = createRoot(container)
    await open('/incidents/INC-404')
    expect(container.querySelector('main h1')?.textContent).toBe('Incident not found')
    expect(container.querySelector('main a[href="/incidents"]')?.textContent).toBe('Back to Incidents')
  })

  it('can retry a failed demo run as Developer and renders genuine pending RCA', async () => {
    await open('/incidents/INC-1042?tab=rca&demo=failed&role=developer')
    expect(button('Retry')?.disabled).toBe(false)
    expect(button('Cancel')?.disabled).toBe(true)
    expect(text()).toContain('RCA pending')
    expect(text()).not.toContain('Probable root cause')
    await act(() => button('Retry')?.click())
    expect(new URLSearchParams(window.location.search).get('demo')).toBeNull()
    expect(button('Cancel')?.disabled).toBe(false)
    expect(text()).toContain('Demo: running snapshot')
  })

  it.each([
    ['completed', 'Draft'],
    ['awaiting-review', 'Awaiting review'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
  ])('shows the correct RCA review state for %s', async (scenario, state) => {
    await open('/incidents/INC-1042?tab=rca&demo=' + scenario)
    expect(container.querySelector('[role="tabpanel"]:not([hidden])')?.textContent ?? '').toContain(state)
    expect(text()).toContain('Probable root cause')
  })

  it('lets Admin review a pending decision as a local action', async () => {
    await open('/incidents/INC-1042?tab=rca&demo=awaiting-review&role=admin')
    expect(button('Approve')?.disabled).toBe(false)
    expect(button('Reject')?.disabled).toBe(false)
    await act(() => button('Approve')?.click())
    expect(new URLSearchParams(window.location.search).get('demo')).toBe('approved')
    expect(text()).toContain('Demo: approval snapshot')
    expect(button('Approve')).toBeUndefined()
  })

  it('keeps Viewer read-only and shows an empty Evidence state', async () => {
    await open('/incidents/INC-1042?tab=evidence&demo=no-evidence&role=viewer')
    expect(text()).toContain('No evidence collected')
    for (const action of ['Cancel', 'Retry', 'Approve', 'Reject']) {
      expect(button(action)).toBeUndefined()
    }
  })

  it('keeps an awaiting review report read-only for Viewer', async () => {
    await open('/incidents/INC-1042?tab=rca&demo=awaiting-review&role=viewer')
    expect(text()).toContain('Awaiting review')
    expect(button('Approve')).toBeUndefined()
    expect(button('Reject')).toBeUndefined()
  })

  it('cancels an active demo run and exposes Retry afterwards', async () => {
    await open()
    expect(button('Cancel')?.disabled).toBe(false)
    await act(() => button('Cancel')?.click())
    expect(new URLSearchParams(window.location.search).get('demo')).toBe('cancelled')
    expect(button('Retry')?.disabled).toBe(false)
    expect(button('Cancel')?.disabled).toBe(true)
  })
})
