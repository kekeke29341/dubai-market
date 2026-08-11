'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDelete = async () => {
    if (!canDelete) return
    setLoading(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error || 'Could not delete account')
        setLoading(false)
        return
      }
      toast.success('Account deleted')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Could not delete account')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:underline text-left"
      >
        Delete account
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-red-800">Delete your account permanently?</p>
        <p className="text-xs text-red-700 mt-1 leading-relaxed">
          This removes your profile, listings, messages, favorites, and points. This cannot be undone.
          Type <span className="font-mono font-bold">DELETE</span> to confirm.
        </p>
      </div>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        autoComplete="off"
        className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setConfirmText('')
          }}
          className="flex-1 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-600 bg-white active:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <Button
          type="button"
          onClick={handleDelete}
          loading={loading}
          disabled={!canDelete}
          variant="danger"
          className="flex-1"
        >
          Delete forever
        </Button>
      </div>
    </div>
  )
}
