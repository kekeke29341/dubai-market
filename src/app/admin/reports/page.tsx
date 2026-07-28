import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { Flag, ExternalLink } from 'lucide-react'
import AdminReportActions from '@/components/admin/AdminReportActions'

export const revalidate = 0

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam / Misleading',
  prohibited: 'Prohibited item',
  fraud: 'Fraud / Scam',
  inappropriate: 'Inappropriate content',
  duplicate: 'Duplicate listing',
  other: 'Other',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const admin = createAdminClient()
  const statusFilter = searchParams.status || 'pending'

  const { data: reports } = await admin
    .from('reports')
    .select(`
      id, reason, details, status, created_at,
      items(id, title, images),
      reporter:profiles!reporter_id(username)
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })
    .limit(50)

  const STATUS_TABS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Dismissed', value: 'dismissed' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Flag className="w-5 h-5 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/reports?status=${tab.value}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              statusFilter === tab.value
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!reports || reports.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Flag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>No {statusFilter} reports</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report: any) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                {/* Item thumbnail */}
                {report.items?.images?.[0] && (
                  <img
                    src={report.items.images[0]}
                    alt={report.items?.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <Link
                        href={`/items/${report.items?.id}`}
                        target="_blank"
                        className="font-semibold text-gray-800 hover:text-amber-600 flex items-center gap-1 text-sm"
                      >
                        {report.items?.title}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Reported by <span className="font-medium">{report.reporter?.username}</span>
                        {' · '}{formatRelativeTime(report.created_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[report.status]}`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    {report.details && (
                      <p className="text-xs text-gray-500 italic">&ldquo;{report.details}&rdquo;</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {report.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <AdminReportActions
                    reportId={report.id}
                    itemId={report.items?.id}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
