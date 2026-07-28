'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MoreHorizontal, Shield, ShieldOff, Ban, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminUserActionsProps {
  user: {
    id: string
    username: string
    is_admin: boolean
    is_banned: boolean
  }
}

export default function AdminUserActions({ user }: AdminUserActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [banModal, setBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [loading, setLoading] = useState(false)

  const update = async (payload: Record<string, unknown>) => {
    setLoading(true)
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('User updated')
      router.refresh()
    }
    setLoading(false)
    setOpen(false)
  }

  const handleToggleAdmin = () => {
    if (!confirm(user.is_admin ? `Remove admin from ${user.username}?` : `Make ${user.username} an admin?`)) return
    update({ is_admin: !user.is_admin })
  }

  const handleBan = async () => {
    await update({ is_banned: true, ban_reason: banReason })
    setBanModal(false)
  }

  const handleUnban = () => {
    update({ is_banned: false, ban_reason: null })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48">
            <button
              onClick={handleToggleAdmin}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition"
            >
              {user.is_admin ? (
                <><ShieldOff className="w-4 h-4 text-gray-400" /> Remove admin</>
              ) : (
                <><Shield className="w-4 h-4 text-amber-500" /> Make admin</>
              )}
            </button>

            <hr className="my-1 border-gray-100" />

            {user.is_banned ? (
              <button
                onClick={handleUnban}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 transition"
              >
                <CheckCircle className="w-4 h-4" />
                Unban user
              </button>
            ) : (
              <button
                onClick={() => { setBanModal(true); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <Ban className="w-4 h-4" />
                Ban user
              </button>
            )}
          </div>
        </>
      )}

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setBanModal(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-1">Ban {user.username}</h3>
            <p className="text-sm text-gray-500 mb-3">This will prevent the user from logging in and listing items.</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={2}
              placeholder="Reason for ban (optional)..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setBanModal(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                Ban user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
