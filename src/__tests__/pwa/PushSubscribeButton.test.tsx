import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PushSubscribeButton from '@/components/pwa/PushSubscribeButton'
import toast from 'react-hot-toast'

// ---------- helpers ----------------------------------------------------------
const mockGetSubscription = vi.fn()
const mockSubscribe = vi.fn()
const mockUnsubscribe = vi.fn()
const mockPushManager = { getSubscription: mockGetSubscription, subscribe: mockSubscribe }
const mockRegistration = { pushManager: mockPushManager }

function setupServiceWorker(hasSubscription: boolean) {
  mockGetSubscription.mockResolvedValue(
    hasSubscription
      ? {
          endpoint: 'https://push.example.com/sub/1',
          unsubscribe: mockUnsubscribe,
          toJSON: () => ({
            endpoint: 'https://push.example.com/sub/1',
            keys: { p256dh: 'abc', auth: 'xyz' },
          }),
        }
      : null
  )
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(mockRegistration) },
    configurable: true,
    writable: true,
  })
}

function setupNotificationPermission(permission: NotificationPermission) {
  Object.defineProperty(Notification, 'permission', {
    value: permission,
    configurable: true,
    writable: true,
  })
  vi.stubGlobal('Notification', {
    ...Notification,
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  })
}

// ---------- mocks ------------------------------------------------------------
// fetch mock for VAPID key + subscribe save
const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mockFetch)
  mockFetch
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ key: 'FAKE_VAPID_PUBLIC_KEY_BASE64URL_AAAAAAA' }) })
    .mockResolvedValue({ ok: true })

  mockSubscribe.mockResolvedValue({
    endpoint: 'https://push.example.com/sub/1',
    unsubscribe: mockUnsubscribe,
    toJSON: () => ({
      endpoint: 'https://push.example.com/sub/1',
      keys: { p256dh: 'abc', auth: 'xyz' },
    }),
  })
  mockUnsubscribe.mockResolvedValue(true)

  // Ensure PushManager exists in window
  Object.defineProperty(window, 'PushManager', { value: {}, configurable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------- tests ------------------------------------------------------------
describe('PushSubscribeButton', () => {
  describe('when push is unsupported', () => {
    it('renders nothing when serviceWorker not in navigator', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined, configurable: true, writable: true,
      })
      const { container } = render(<PushSubscribeButton />)
      // Component renders null for 'unsupported'
      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('when permission is denied', () => {
    it('shows "Notifications blocked" message', async () => {
      setupServiceWorker(false)
      setupNotificationPermission('denied')

      render(<PushSubscribeButton />)
      await waitFor(() => {
        expect(screen.getByText(/notifications blocked/i)).toBeInTheDocument()
      })
    })
  })

  describe('when not subscribed', () => {
    beforeEach(() => {
      setupServiceWorker(false)
      setupNotificationPermission('default')
    })

    it('shows "Enable notifications" button', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument()
      })
    })

    it('shows success toast on successful subscribe', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /enable notifications/i }))

      // requestPermission will be called in subscribe()
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      })

      await userEvent.click(screen.getByRole('button', { name: /enable notifications/i }))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Push notifications enabled!')
      })
    })

    it('switches to "Notifications on" button after subscribe', async () => {
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      })

      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /enable notifications/i }))
      await userEvent.click(screen.getByRole('button', { name: /enable notifications/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications on/i })).toBeInTheDocument()
      })
    })

    it('shows denied message when permission denied on request', async () => {
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      })

      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /enable notifications/i }))
      await userEvent.click(screen.getByRole('button', { name: /enable notifications/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Notifications blocked. Enable them in browser settings.'
        )
      })
    })

    it('calls POST /api/push/subscribe with subscription data', async () => {
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      })

      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /enable notifications/i }))
      await userEvent.click(screen.getByRole('button', { name: /enable notifications/i }))

      await waitFor(() => {
        const postCall = mockFetch.mock.calls.find(
          (c) => c[0] === '/api/push/subscribe' && c[1]?.method === 'POST'
        )
        expect(postCall).toBeTruthy()
      })
    })
  })

  describe('when already subscribed', () => {
    beforeEach(() => {
      setupServiceWorker(true)
      setupNotificationPermission('granted')
    })

    it('shows "Notifications on" button', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications on/i })).toBeInTheDocument()
      })
    })

    it('calls unsubscribe on click', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /notifications on/i }))
      await userEvent.click(screen.getByRole('button', { name: /notifications on/i }))

      await waitFor(() => {
        expect(mockUnsubscribe).toHaveBeenCalled()
      })
    })

    it('calls DELETE /api/push/subscribe on unsubscribe', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /notifications on/i }))
      await userEvent.click(screen.getByRole('button', { name: /notifications on/i }))

      await waitFor(() => {
        const deleteCall = mockFetch.mock.calls.find(
          (c) => c[0] === '/api/push/subscribe' && c[1]?.method === 'DELETE'
        )
        expect(deleteCall).toBeTruthy()
      })
    })

    it('shows success toast on unsubscribe', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /notifications on/i }))
      await userEvent.click(screen.getByRole('button', { name: /notifications on/i }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Push notifications disabled')
      })
    })

    it('switches to "Enable notifications" button after unsubscribe', async () => {
      render(<PushSubscribeButton />)
      await waitFor(() => screen.getByRole('button', { name: /notifications on/i }))
      await userEvent.click(screen.getByRole('button', { name: /notifications on/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument()
      })
    })
  })
})
