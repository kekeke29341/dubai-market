import { createAdminClient } from '@/lib/supabase/admin'
import { runSecurityChecks } from '@/lib/securityChecks'
import { formatRelativeTime } from '@/lib/utils'
import SecurityCheckList from '@/components/admin/SecurityCheckList'
import AdminProhibitedWords from '@/components/admin/AdminProhibitedWords'
import { Shield } from 'lucide-react'

export const revalidate = 0

function scoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-red-600'
}

export default async function AdminSecurityPage() {
  const admin = createAdminClient()

  const [result, wordsRes, logsRes] = await Promise.all([
    runSecurityChecks(admin),
    admin.from('prohibited_words').select('id, word, active').order('word', { ascending: true }),
    admin
      .from('admin_audit_logs')
      .select('id, action, target_type, target_id, details, created_at, profiles!admin_id(username)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const words = wordsRes.data ?? []
  const logs = logsRes.data ?? []

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">Security</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Automated checks, prohibited-word list, and admin audit trail
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-right">
          <p className="text-xs text-gray-500">Security score</p>
          <p className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}</p>
          <p className="text-[11px] text-gray-400">
            {result.summary.pass} pass · {result.summary.warn} warn · {result.summary.fail} fail
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Security checks</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Last run {formatRelativeTime(result.generatedAt)}
            </p>
          </div>
          <SecurityCheckList checks={result.checks} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Prohibited words</h2>
          <p className="text-xs text-gray-400 mb-4">
            Titles and descriptions that contain these words are blocked on save.
          </p>
          <AdminProhibitedWords words={words} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Admin audit log</h2>
          <p className="text-xs text-gray-400 mt-0.5">Recent moderation and security actions</p>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            No audit events yet. Apply security_hardening_migration.sql, then take an admin action.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">When</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.profiles?.username ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{log.action}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {[log.target_type, log.target_id].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
