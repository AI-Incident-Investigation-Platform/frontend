// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  window.localStorage.clear()
  window.sessionStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function open(url: string) {
  window.history.replaceState(null, '', url)
  await act(() => root.render(<BrowserRouter><App /></BrowserRouter>))
}

function element<T extends HTMLElement>(selector: string): T {
  const result = container.querySelector<T>(selector)
  if (!result) throw new Error('Missing ' + selector)
  return result
}

async function type(selector: string, value: string) {
  const field = element<HTMLInputElement>(selector)
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(() => {
    setter?.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function click(selector: string) {
  await act(() => element(selector).click())
}

async function submit() {
  await click('main button[type=submit]')
  await act(async () => vi.advanceTimersByTimeAsync(300))
}

async function login() {
  await type('input[name=email]', 'analyst@example.test')
  await type('input[name=password]', 'demo-password')
  await submit()
}

describe('demo login flow', () => {
  it('shows an inline error for an empty domain label and allows the corrected email', async () => {
    await open('/login')
    await type('input[name=email]', 'analyst@example..test')
    await type('input[name=password]', 'demo-password')
    await submit()

    expect(window.location.pathname).toBe('/login')
    const email = element('input[name=email]')
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(email)
    expect(element('#' + email.getAttribute('aria-describedby')).textContent).toBe('Enter a valid email address.')

    await type('input[name=email]', 'analyst@example.test')
    expect(container.querySelector('#demo-email-error')).toBeNull()
    await submit()
    expect(window.location.pathname).toBe('/verify-email-otp')
  })

  it('validates fields, toggles visibility and requires a six-digit pasted OTP before Overview', async () => {
    await open('/login')
    expect(container.querySelector('.app-shell')).toBeNull()
    await submit()
    expect(element('input[name=email]').getAttribute('aria-invalid')).toBe('true')
    expect(element('input[name=password]').getAttribute('aria-invalid')).toBe('true')
    await click('button[aria-controls="demo-password"]')
    expect(element<HTMLInputElement>('input[name=password]').type).toBe('text')
    await click('button[aria-controls="demo-password"]')
    expect(element<HTMLInputElement>('input[name=password]').type).toBe('password')
    await login()
    expect(window.location.pathname).toBe('/verify-email-otp')
    expect(container.textContent).toContain('a••••@example.test')
    expect(container.textContent).toContain('Development demo')
    expect(container.querySelector('.app-shell')).toBeNull()

    await act(() => {
      window.history.pushState(window.history.state, '', '/overview')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(window.location.pathname).toBe('/verify-email-otp')
    await type('input[name=otp]', '12345')
    await submit()
    expect(element('input[name=otp]').getAttribute('aria-invalid')).toBe('true')
    const code = element('[data-demo-code]').textContent
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => code } })
    await act(() => element('input[name=otp]').dispatchEvent(paste))
    await submit()
    expect(window.location.pathname).toBe('/overview')
    expect(container.querySelector('.app-shell')).not.toBeNull()
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0)
    await click('header a[href="/login"]')
    await login()
    expect(window.location.pathname).toBe('/verify-email-otp')
  })

  it('requires login for a direct OTP route and after abandoning a challenge', async () => {
    await open('/verify-email-otp')
    expect(window.location.pathname).toBe('/login')
    await login()
    await click('a[href="/login"]')
    expect(window.location.pathname).toBe('/login')
    await act(() => {
      window.history.pushState(window.history.state, '', '/verify-email-otp')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(window.location.pathname).toBe('/login')
  })
})
