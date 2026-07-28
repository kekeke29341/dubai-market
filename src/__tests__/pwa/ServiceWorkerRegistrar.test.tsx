import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'

describe('ServiceWorkerRegistrar', () => {
  const originalSW = navigator.serviceWorker

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalSW,
      configurable: true,
      writable: true,
    })
  })

  it('renders null (no DOM output)', () => {
    const { container } = render(<ServiceWorkerRegistrar />)
    expect(container.firstChild).toBeNull()
  })

  it('registers service worker when supported', () => {
    const mockRegister = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
      writable: true,
    })

    render(<ServiceWorkerRegistrar />)
    expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('does not throw when serviceWorker is not in navigator', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow()
  })

  it('silently catches registration errors', () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error('SW registration failed'))
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
      writable: true,
    })

    // Should not throw even if register rejects
    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow()
  })
})
