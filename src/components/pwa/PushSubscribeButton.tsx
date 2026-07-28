'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0))
}

type State = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export default function PushSubscribeButton() {
  const [state, setState] = useState<State>('loading')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [])

  const subscribe = async () => {
    setWorking(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        toast.error('Notifications blocked. Enable them in browser settings.')
        return
      }

      const res = await fetch('/api/push/vapid-public-key')
      if (!res.ok) throw new Error('VAPID key unavailable')
      const { key } = await res.json()

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })

      const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subJson),
      })
      if (!saveRes.ok) throw new Error('Failed to save subscription')

      setState('subscribed')
      toast.success('Push notifications enabled!')
    } catch (err) {
      console.error(err)
      toast.error('Could not enable notifications')
    } finally {
      setWorking(false)
    }
  }

  const unsubscribe = async () => {
    setWorking(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('unsubscribed')
      toast.success('Push notifications disabled')
    } catch {
      toast.error('Could not disable notifications')
    } finally {
      setWorking(false)
    }
  }

  if (state === 'unsupported') return null
  if (state === 'loading') return null

  if (state === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <BellOff className="w-4 h-4" />
        Notifications blocked
      </div>
    )
  }

  if (state === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        disabled={working}
        className="flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
      >
        <BellRing className="w-4 h-4 text-amber-500" />
        Notifications on
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={working}
      className="flex items-center gap-2 text-sm px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition disabled:opacity-50"
    >
      <Bell className="w-4 h-4" />
      Enable notifications
    </button>
  )
}
