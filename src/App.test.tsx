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
