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
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0',
      configurable: true,
    })
    // Ensure we are not treated as the native shell
    // @ts-expect-error test cleanup
    delete window.__DUBAI_MARKET_NATIVE__
    delete (window as any).ReactNativeWebView

    render(<ServiceWorkerRegistrar />)
    expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('skips registration inside the native Expo shell', () => {
    const mockRegister = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 DubaiMarketApp/1.0',
      configurable: true,
    })

    render(<ServiceWorkerRegistrar />)
    expect(mockRegister).not.toHaveBeenCalled()
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
