// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { ServiceMapPage } from './ServiceMapPage'

it('selects the URL service, derives its dependencies and links its incident', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(() => root.render(
      <MemoryRouter initialEntries={['/service-map?serviceId=payment-service']}>
        <Routes><Route path="/service-map" element={<ServiceMapPage />} /></Routes>
      </MemoryRouter>,
    ))
    expect(container.querySelectorAll('.map-node')).toHaveLength(6)
    expect(container.querySelector('.map-node[aria-pressed="true"]')?.textContent).toContain('payment-service')
    expect(container.querySelector('.map-details')?.textContent).toContain('12.8%')
    expect(container.querySelector('.map-details')?.textContent).toContain('Dependencies4')
    expect(container.querySelector('a[href="/incidents/INC-1042"]')).not.toBeNull()

    const review = container.querySelector<HTMLButtonElement>('.map-node[data-service-id="review-service"]')
    await act(() => review?.click())
    expect(review?.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.map-details')?.textContent).toContain('review-service')
  } finally {
    await act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  }
})
