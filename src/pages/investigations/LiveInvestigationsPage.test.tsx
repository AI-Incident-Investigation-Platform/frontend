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

async function open(query = '') {
  window.history.replaceState(null, '', '/investigations' + query)
  await act(() => root.render(<BrowserRouter><App /></BrowserRouter>))
}

function text() {
  return container.querySelector('main')?.textContent ?? ''
}

async function selectScenario(scenario: string) {
  const control = container.querySelector<HTMLSelectElement>('select[name="demo"]')
  expect(control).not.toBeNull()
  await act(() => {
    if (!control) return
    control.value = scenario
    control.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('Live Investigations', () => {
  it('changes feeds in place and opens the right incident and run context', async () => {
    await open()
    expect(container.querySelectorAll('.run-select')).toHaveLength(4)
    expect(text()).toContain('STEP 12 / 20')
    expect(text()).toContain('git_diff')
    const header = container.querySelector('header')
    const order = Array.from(container.querySelectorAll<HTMLButtonElement>('.run-select'))
      .find((button) => button.textContent?.includes('INC-1041'))
    await act(() => order?.click())
    expect(container.querySelector('header')).toBe(header)
    expect(order?.getAttribute('aria-pressed')).toBe('true')
    expect(text()).toContain('compare_latency')
    expect(text()).not.toContain('git_diff')
    const link = container.querySelector<HTMLAnchorElement>('main a[href^="/incidents/INC-1041"]')
    expect(link).not.toBeNull()
    await act(() => link?.click())
    expect(window.location.pathname).toBe('/incidents/INC-1041')
    expect(container.querySelector('main h1')?.textContent).toBe('INC-1041 / order-service')
    expect(text()).toContain('compare_latency')
  })

  it('plays snapshots from queued to running to awaiting review', async () => {
    await open('?demo=pending')
    expect(text()).toContain('STEP 0 / 20')
    expect(text()).toContain('Waiting for the first tool call')
    await selectScenario('running')
    expect(text()).toContain('STEP 12 / 20')
    await selectScenario('awaiting-review')
    expect(text()).toContain('STEP 20 / 20')
    expect(container.querySelector('.run-select[aria-pressed="true"]')?.textContent).toContain('Awaiting review')
  })

  it('deduplicates a repeated event and shows the updated long outcome', async () => {
    await open('?demo=repeated')
    expect(container.querySelectorAll('.run-events li')).toHaveLength(5)
    expect(text()).toContain('checkout-20261016-eu-west')
  })

  it.each([
    ['failed', 'timed out after 90 s'],
    ['completed', 'STEP 20 / 20'],
    ['cancelled', 'stopped in the demo run'],
    ['no-live', 'No live runs'],
    ['empty', 'No agent runs'],
  ])('shows the %s snapshot', async (scenario, expected) => {
    await open('?demo=' + scenario)
    expect(text()).toContain(expected)
  })
})
