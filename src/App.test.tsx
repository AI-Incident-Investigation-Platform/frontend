// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

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

async function open(path: string) {
  window.history.replaceState(null, '', path)
  await act(() => root.render(<BrowserRouter><App /></BrowserRouter>))
}

function activeRoute() {
  return container.querySelector('aside [aria-current="page"]')?.getAttribute('href')
}

describe('app routing', () => {
  it('replaces / with /overview and marks Overview as active', async () => {
    const historyLength = window.history.length
    await open('/')

    expect(window.location.pathname).toBe('/overview')
    expect(window.history.length).toBe(historyLength)
    expect(activeRoute()).toBe('/overview')
  })

  it('opens every sidebar destination and updates the active link in the same shell', async () => {
    await open('/overview')
    const sidebar = container.querySelector('aside')
    const header = container.querySelector('header')
    const links = sidebar?.querySelectorAll<HTMLAnchorElement>('nav a') ?? []

    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
      '/overview', '/incidents', '/investigations', '/service-map',
      '/logs-metrics', '/traces', '/integrations', '/settings',
    ])

    for (const link of links) {
      await act(() => link.click())
      expect(window.location.pathname).toBe(link.pathname)
      expect(activeRoute()).toBe(link.pathname)
      expect(container.querySelector('main h1')?.textContent).toBeTruthy()
      expect(container.querySelector('aside')).toBe(sidebar)
      expect(container.querySelector('header')).toBe(header)
    }
  })

  it('displays the incident URL parameter and keeps the Incidents section active', async () => {
    await open('/incidents/INC-1042')

    expect(container.querySelector('main h1')?.textContent ?? '').toContain('INC-1042')
    expect(activeRoute()).toBe('/incidents')
  })

  it('shows a recoverable 404 and clears the active section for an unknown URL', async () => {
    await open('/unknown')
    const link = container.querySelector<HTMLAnchorElement>('main a[href="/overview"]')

    expect(container.querySelector('main h1')?.textContent ?? '').toContain('404')
    expect(activeRoute()).toBeUndefined()
    expect(link).not.toBeNull()

    await act(() => link?.click())
    expect(window.location.pathname).toBe('/overview')
  })
})

function metric(label: string) {
  return Array.from(container.querySelectorAll('main dl'))
    .find((card) => card.querySelector('dt')?.textContent === label)
}

function metricValues(label: string) {
  return Array.from(metric(label)?.querySelectorAll('dd') ?? [], (value) => value.textContent)
}

describe('overview', () => {
  it('shows the four snapshot metrics and five recent incidents in descending order', async () => {
    await open('/overview')

    expect(metricValues('Active Incidents')).toEqual(['12', '2 critical'])
    expect(metricValues('Investigating')).toEqual(['03', '1 agent running'])
    expect(metricValues('P95 Latency')).toEqual(['892 ms', '+183 ms / 1 h'])
    expect(metricValues('Healthy Services')).toEqual(['17 / 20', '3 require attention'])
    expect(Array.from(
      container.querySelectorAll('table[aria-label="Recent incidents"] tbody a'),
      (link) => link.textContent,
    )).toEqual(['INC-1042', 'INC-1041', 'INC-1040', 'INC-1039', 'INC-1038'])
  })

  it('passes the incident ID to the current detail placeholder', async () => {
    await open('/overview')
    const link = container.querySelector<HTMLAnchorElement>('main a[href="/incidents/INC-1042"]')
    expect(link).not.toBeNull()

    await act(() => link?.click())
    expect(window.location.pathname).toBe('/incidents/INC-1042')
    expect(container.querySelector('main h1')?.textContent).toBe('INC-1042 / payment-service')
  })

  it('shows three signals and carries the selected service ID to Service Map', async () => {
    await open('/overview')
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('main a[href^="/service-map?"]'))

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/service-map?serviceId=payment-service',
      '/service-map?serviceId=order-service',
      '/service-map?serviceId=review-service',
    ])
    expect(links.map((link) => link.textContent)).toEqual([
      'payment-service5xx rate 12.8%Critical',
      'order-servicep95 latency 1.4 sHigh',
      'review-serviceConsumer lag 1.2kHigh',
    ])

    await act(() => links[1].click())
    expect(window.location.pathname + window.location.search).toBe('/service-map?serviceId=order-service')
    expect(activeRoute()).toBe('/service-map')
  })

  it('announces the loading fixture', async () => {
    await open('/overview?demo=loading')

    expect(container.querySelector('main [role="status"]')?.textContent).toBe('Loading overview…')
    expect(container.querySelectorAll('main dl')).toHaveLength(0)
  })

  it('shows the empty incident fixture with zero active incidents and keeps service signals', async () => {
    await open('/overview?demo=empty')

    expect(container.querySelector('main')?.textContent ?? '').toContain('No recent incidents')
    expect(metricValues('Active Incidents')).toEqual(['0', '0 critical'])
    expect(metricValues('Investigating')).toEqual(['00', '0 agents running'])
    expect(container.querySelectorAll('main a[href^="/service-map?"]')).toHaveLength(3)
    expect(container.querySelector('main table')).toBeNull()
  })

  it('announces a mock adapter failure and links back to the default demo', async () => {
    await open('/overview?demo=error')
    const link = container.querySelector<HTMLAnchorElement>('main a[href="/overview"]')
    expect(container.querySelector('main [role="alert"]')?.textContent ?? '').toContain('Overview unavailable')
    expect(link).not.toBeNull()

    await act(() => link?.click())
    expect(window.location.search).toBe('')
    expect(container.querySelectorAll('main dl')).toHaveLength(4)
  })

  it('preserves a long incident ID in both the link and destination', async () => {
    await open('/overview?demo=long')
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('table tbody a'))
    const longLink = links.find((link) => (link.textContent?.length ?? 0) > 40)
    expect(longLink).toBeDefined()
    expect(longLink?.pathname).toBe('/incidents/' + longLink?.textContent)

    await act(() => longLink?.click())
    expect(container.querySelector('main h1')?.textContent).toBe(longLink?.textContent)
  })
})
