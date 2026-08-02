'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error('Something went wrong. Please try again.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Reset your password</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sent
                ? 'Check your inbox for the reset link'
                : "Enter your email and we'll send a reset link"}
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                We sent a password reset link to <strong>{email}</strong>. Check your spam folder if it doesn&apos;t arrive.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { setSent(false); setEmail('') }}
              >
                Send again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" loading={loading} className="w-full mt-2">
                Send reset link
              </Button>
            </form>
          )}

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
