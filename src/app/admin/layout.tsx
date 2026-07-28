import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, Users, Flag, ChevronRight } from 'lucide-react'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'

export const metadata = { title: 'Admin — Dubai Market' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/items', label: 'Items', icon: Package },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/reports', label: 'Reports', icon: Flag },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{profile.username}</p>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition group"
            >
              <Icon className="w-4 h-4" />
              {label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50" />
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            ← Back to site
          </Link>
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
