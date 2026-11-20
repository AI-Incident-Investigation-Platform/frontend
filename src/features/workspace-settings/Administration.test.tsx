// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

let root: Root
let container: HTMLDivElement
const dialogProto = HTMLDialogElement.prototype
const originalMethods = {
  showModal: Object.getOwnPropertyDescriptor(dialogProto, 'showModal'),
  close: Object.getOwnPropertyDescriptor(dialogProto, 'close'),
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  Object.defineProperties(dialogProto, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', '') } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  for (const [name, descriptor] of Object.entries(originalMethods)) {
    if (descriptor) Object.defineProperty(dialogProto, name, descriptor)
    else Reflect.deleteProperty(dialogProto, name)
  }
})

async function open(url: string) {
  window.history.replaceState(null, '', url)
  await act(() => root.render(<BrowserRouter><App /></BrowserRouter>))
}

function find<T extends HTMLElement>(selector: string): T {
  const result = container.querySelector<T>(selector)
  if (!result) throw new Error('Missing element: ' + selector)
  return result
}

async function click(selector: string) {
  await act(() => find(selector).click())
}

async function enter(selector: string, value: string) {
  const field = find<HTMLInputElement>(selector)
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(() => {
    setter?.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function choose(selector: string, value: string) {
  const field = find<HTMLSelectElement>(selector)
  await act(() => {
    field.value = value
    field.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('FE-07 Integrations', () => {
  it('opens a provider-specific form, validates URLs and supports reset and cancel', async () => {
    await open('/integrations')
    expect(container.querySelectorAll('.source-row')).toHaveLength(6)
    await click('button[aria-label="Configure Elasticsearch"]')
    expect(find<HTMLInputElement>('dialog input[name=endpoint]').value).toBe('https://logs.example:9200')
    expect(find('dialog input[name=indexPattern]')).toBeTruthy()
    await enter('dialog input[name=endpoint]', 'https://person:demo-value@logs.example')
    await click('dialog button[type=submit]')
    expect(find('dialog input[name=endpoint]').getAttribute('aria-invalid')).toBe('true')
    expect(find('dialog').textContent).toContain('without credentials')
    await click('dialog button[type=reset]')
    expect(find<HTMLInputElement>('dialog input[name=endpoint]').value).toBe('https://logs.example:9200')
    await enter('dialog input[name=endpoint]', 'https://other.example')
    await click('dialog [data-cancel]')
    expect(container.querySelector('main dialog')).toBeNull()
    expect(find('.source-row').textContent).toContain('https://logs.example:9200')
  })

  it('saves a local config and adds a disconnected source from an empty demo', async () => {
    await open('/integrations?demo=empty')
    expect(find('main').textContent).toContain('No integrations configured')
    await click('[data-add-integration]')
    await choose('dialog select[name=provider]', 'github')
    await enter('dialog input[name=repository]', 'acme-demo/payments')
    await enter('dialog input[name=branch]', 'main')
    await click('dialog button[type=submit]')
    expect(find('.source-row').textContent).toContain('acme-demo/payments')
    expect(find('.source-row').textContent).toContain('Disconnected')
    expect(find('main [role=status]').textContent).toContain('Added locally')
  })
})

describe('FE-07 Settings', () => {
  it('validates fields, saves for Admin and restores the saved values on reset', async () => {
    await open('/settings')
    await enter('input[name=workspaceName]', '  ')
    await enter('input[name=retentionDays]', '366')
    await click('main button[type=submit]')
    expect(find('input[name=workspaceName]').getAttribute('aria-invalid')).toBe('true')
    expect(find('input[name=retentionDays]').getAttribute('aria-invalid')).toBe('true')
    await enter('input[name=workspaceName]', 'SRE Platform QA')
    await enter('input[name=retentionDays]', '120')
    await click('main button[type=submit]')
    expect(find('main [role=status]').textContent).toContain('Saved for this demo session')
    await enter('input[name=workspaceName]', 'Unsaved')
    await click('main button[type=reset]')
    expect(find<HTMLInputElement>('input[name=workspaceName]').value).toBe('SRE Platform QA')
    await click('aside a[href="/overview"]')
    await click('aside a[href="/settings"]')
    expect(find<HTMLInputElement>('input[name=retentionDays]').value).toBe('120')
  })

  it.each(['viewer', 'developer'])('keeps the workspace read-only as %s', async (role) => {
    await open('/settings?role=' + role)
    expect(find('input[name=workspaceName]').matches(':disabled')).toBe(true)
    expect(container.querySelector('main button[type=submit]')).toBeNull()
    const limits = find('.settings-limits')
    expect(limits.textContent).toContain('20 minutes')
    expect(limits.textContent).toContain('40')
    expect(limits.textContent).toContain('20')
    expect(limits.querySelector('input, select, button')).toBeNull()
    await choose('select[name=role]', 'admin')
    expect(find('input[name=workspaceName]').matches(':disabled')).toBe(false)
    expect(find('main button[type=submit]')).toBeTruthy()
  })
})
