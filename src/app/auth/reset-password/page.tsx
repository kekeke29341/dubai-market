'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase sets the session from the URL hash after the user clicks the link
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const strength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }
  const score = strength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][score]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated! You are now signed in.')
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Verifying reset link…</p>
          <p className="text-gray-400 text-xs mt-2">If this page stays blank, the link may have expired. <a href="/auth/forgot-password" className="text-amber-600 hover:underline">Request a new one.</a></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Choose a new password</h1>
            <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">New password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${i <= score ? strengthColor : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
              error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
