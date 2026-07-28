import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import AdminItemActions from '@/components/admin/AdminItemActions'
import { Search } from 'lucide-react'

interface PageProps {
  searchParams: {
    status?: string
    flagged?: string
    q?: string
    page?: string
  }
}

export const revalidate = 0
const PAGE_SIZE = 20

export default async function AdminItemsPage({ searchParams }: PageProps) {
  const admin = createAdminClient()
  const page = parseInt(searchParams.page || '1')
  const offset = (page - 1) * PAGE_SIZE

  let query = admin
    .from('items')
    .select('*, profiles(id, username)', { count: 'exact' })
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.flagged === 'true') query = query.eq('is_flagged', true)
  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)

  const { data: items, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count ?? 0} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          {/* Status tabs */}
          <div className="flex gap-1">
            {[
              { label: 'All', href: '/admin/items' },
              { label: 'Active', href: '/admin/items?status=active' },
              { label: 'Sold', href: '/admin/items?status=sold' },
              { label: 'Reserved', href: '/admin/items?status=reserved' },
              { label: '🚩 Flagged', href: '/admin/items?flagged=true' },
            ].map((tab) => {
              const isActive =
                (tab.label === 'All' && !searchParams.status && !searchParams.flagged) ||
                (tab.label === '🚩 Flagged' && searchParams.flagged === 'true') ||
                searchParams.status === tab.label.toLowerCase()
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          {/* Search */}
          <form className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search title..."
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Seller</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Listed</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.is_flagged && <span title="Flagged">🚩</span>}
                      <Link
                        href={`/items/${item.id}`}
                        target="_blank"
                        className="font-medium text-gray-800 hover:text-amber-600 truncate max-w-[200px] block"
                      >
                        {item.title}
                      </Link>
                    </div>
                    {item.admin_note && (
                      <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]">Note: {item.admin_note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users?q=${item.profiles?.username}`}
                      className="text-gray-600 hover:text-amber-600"
                    >
                      {item.profiles?.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-amber-600">
                    {formatPrice(item.price, item.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'active' ? 'bg-green-100 text-green-700' :
                      item.status === 'sold' ? 'bg-gray-100 text-gray-600' :
                      item.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(item.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminItemActions item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!items || items.length === 0) && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              No items found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/items?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/items?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
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
