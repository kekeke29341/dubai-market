import { createAdminClient } from '@/lib/supabase/admin'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { Search } from 'lucide-react'
import AdminUserActions from '@/components/admin/AdminUserActions'

interface PageProps {
  searchParams: {
    q?: string
    filter?: string
    page?: string
  }
}

export const revalidate = 0
const PAGE_SIZE = 20

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const admin = createAdminClient()
  const page = parseInt(searchParams.page || '1')
  const offset = (page - 1) * PAGE_SIZE

  let query = admin
    .from('profiles')
    .select('*, items(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (searchParams.q) {
    query = query.or(`username.ilike.%${searchParams.q}%,full_name.ilike.%${searchParams.q}%`)
  }
  if (searchParams.filter === 'admin') query = query.eq('is_admin', true)
  if (searchParams.filter === 'banned') query = query.eq('is_banned', true)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count ?? 0} registered users</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filter + Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          <div className="flex gap-1">
            {[
              { label: 'All', href: '/admin/users', filter: undefined },
              { label: 'Admins', href: '/admin/users?filter=admin', filter: 'admin' },
              { label: 'Banned', href: '/admin/users?filter=banned', filter: 'banned' },
            ].map((tab) => {
              const isActive =
                (tab.filter === undefined && !searchParams.filter) ||
                searchParams.filter === tab.filter
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          <form className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search username..."
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map((user: any) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.is_banned ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-600 font-bold text-xs">
                          {getInitials(user.username)}
                        </span>
                      </div>
                      <div>
                        <Link
                          href={`/profile/${user.id}`}
                          target="_blank"
                          className="font-medium text-gray-800 hover:text-amber-600"
                        >
                          {user.username}
                        </Link>
                        {user.full_name && (
                          <p className="text-xs text-gray-400">{user.full_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.location || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {(user.items as any)?.[0]?.count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.rating ? `⭐ ${user.rating.toFixed(1)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.is_admin && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                      {user.is_banned && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          Banned
                        </span>
                      )}
                      {!user.is_admin && !user.is_banned && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    {user.ban_reason && (
                      <p className="text-xs text-red-400 mt-0.5 truncate max-w-[120px]">{user.ban_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AdminUserActions user={user} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!users || users.length === 0) && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              No users found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/users?${new URLSearchParams(Object.fromEntries(Object.entries({ ...searchParams, page: String(page - 1) }).filter(([, v]) => v !== undefined)) as Record<string, string>)}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/users?${new URLSearchParams(Object.fromEntries(Object.entries({ ...searchParams, page: String(page + 1) }).filter(([, v]) => v !== undefined)) as Record<string, string>)}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
