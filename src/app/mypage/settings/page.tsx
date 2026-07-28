'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { ChevronLeft, Camera, Eye, EyeOff } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import PushSubscribeButton from '@/components/pwa/PushSubscribeButton'

export default function SettingsPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    location: 'Dubai, UAE',
  })
  const [pwdForm, setPwdForm] = useState({ newPwd: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login?redirectTo=/mypage/settings'); return }
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || null)
        setForm({
          full_name: data.full_name || '',
          bio: data.bio || '',
          location: data.location || 'Dubai, UAE',
        })
      }
    })
  }, [supabase, router])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB')
      return
    }
    setAvatarLoading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error || !data) {
      toast.error('Failed to upload avatar')
      setAvatarLoading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    // Add cache-bust so Next.js Image re-fetches
    const busted = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: busted }).eq('id', userId)
    setAvatarUrl(busted)
    toast.success('Avatar updated!')
    setAvatarLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    // Validate username
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      toast.error('Username: 3–30 chars, letters/numbers/underscore only')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username, ...form })
      .eq('id', userId)
    if (error) {
      if (error.code === '23505') {
        toast.error('That username is already taken')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Profile updated!')
      router.push('/mypage')
    }
    setLoading(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.newPwd !== pwdForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (pwdForm.newPwd.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwdForm.newPwd })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated!')
      setPwdForm({ newPwd: '', confirm: '' })
    }
    setPwdLoading(false)
  }

  const initials = getInitials(username)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="p-1.5 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="object-cover rounded-full" />
            ) : (
              <span className="text-amber-600 font-bold text-2xl">{initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-md transition disabled:opacity-50"
            aria-label="Change avatar"
          >
            {avatarLoading
              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP · max 5 MB</p>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          hint="3–30 characters, letters, numbers, and underscores only"
        />
        <Input
          label="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell buyers about yourself..."
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-0.5">{form.bio.length}/300</p>
        </div>
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Dubai, UAE"
        />
        <Button type="submit" loading={loading} className="w-full mt-2">
          Save changes
        </Button>
      </form>

      {/* Push notifications */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-base font-bold text-gray-800 mb-1">Push notifications</h2>
        <p className="text-sm text-gray-500 mb-4">
          Get notified about price drops, new listings from sellers you follow, and messages.
        </p>
        <PushSubscribeButton />
      </div>

      {/* Password change */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-base font-bold text-gray-800 mb-4">Change password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">New password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={pwdForm.newPwd}
                onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Input
            label="Confirm new password"
            type="password"
            value={pwdForm.confirm}
            onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
            placeholder="Repeat new password"
            error={pwdForm.confirm && pwdForm.confirm !== pwdForm.newPwd ? 'Passwords do not match' : undefined}
          />
          <Button type="submit" loading={pwdLoading} variant="secondary" className="w-full">
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
