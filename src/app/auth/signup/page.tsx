'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()

  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' })
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username, full_name: form.full_name },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Welcome to DubaiMarket 🎉')
      router.push('/')
      router.refresh()
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
            <h1 className="text-xl font-bold text-gray-900">Create an account</h1>
            <p className="text-sm text-gray-500 mt-1">Join DubaiMarket and start buying or selling</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="your_username"
              required
              hint="This will be your public display name"
            />
            <Input
              label="Full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ahmed Al Mansoori"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              required
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-amber-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
