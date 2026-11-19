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
  window.history.replaceState(null, '', '/incidents' + query)
  await act(() => root.render(<BrowserRouter><App /></BrowserRouter>))
}

function ids() {
  return Array.from(container.querySelectorAll('table tbody a'), (link) => link.textContent)
}

describe('incident registry', () => {
  it('opens the canonical incident route and keeps Incidents active', async () => {
    await open()
    expect(ids()).toHaveLength(13)

    const link = container.querySelector<HTMLAnchorElement>('tbody a[href="/incidents/INC-1042"]')
    expect(link).not.toBeNull()
    await act(() => link?.click())
    expect(window.location.pathname).toBe('/incidents/INC-1042')
    expect(container.querySelector('main h1')?.textContent).toBe('INC-1042 / payment-service')
    expect(container.querySelector('aside [aria-current="page"]')?.getAttribute('href')).toBe('/incidents')
  })

  it('lists the same recent incident IDs as Overview', async () => {
    await open()
    const overview = container.querySelector<HTMLAnchorElement>('aside a[href="/overview"]')
    const registry = container.querySelector<HTMLAnchorElement>('aside a[href="/incidents"]')

    await act(() => overview?.click())
    const recentIds = ids()
    expect(recentIds).toHaveLength(5)

    await act(() => registry?.click())
    expect(ids().slice(0, recentIds.length)).toEqual(recentIds)
  })

  it('resets combined filters after an empty result', async () => {
    await open()
    const select = async (name: string, value: string) => {
      const control = container.querySelector<HTMLSelectElement>('select[name="' + name + '"]')
      expect(control).not.toBeNull()
      await act(() => {
        if (!control) return
        control.value = value
        control.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }
    await select('severity', 'critical')
    await select('status', 'resolved')
    expect(container.querySelector('main')?.textContent).toContain('No matching incidents')

    const reset = Array.from(container.querySelectorAll<HTMLButtonElement>('main button'))
      .find((button) => button.textContent === 'Reset filters' && !button.disabled)
    expect(reset).toBeDefined()
    await act(() => reset?.click())
    expect(ids()).toHaveLength(13)
  })

  it('toggles detected sorting and reports the selected direction', async () => {
    await open()
    const sort = container.querySelector<HTMLButtonElement>('th[aria-sort="descending"] button')
    expect(sort).not.toBeNull()
    expect(ids()[0]).toBe('INC-1042')

    await act(() => sort?.click())
    expect(container.querySelector('th[aria-sort="ascending"]')).not.toBeNull()
    expect(ids()[0]).toBe('INC-1030')
  })

  it.each([
    ['loading', 'Loading incidents'],
    ['error', 'Incidents unavailable'],
    ['empty', 'No incidents in this demo'],
  ])('shows the %s fixture', async (scenario, message) => {
    await open('?demo=' + scenario)
    expect(container.querySelector('main')?.textContent).toContain(message)
    expect(ids()).toHaveLength(0)
  })

  it('preserves the complete long ID in its link', async () => {
    await open('?demo=long')
    const link = container.querySelector<HTMLAnchorElement>('tbody a')
    expect(link?.textContent?.length).toBeGreaterThan(40)
    expect(link?.getAttribute('href')).toBe('/incidents/' + link?.textContent)
  })
})
