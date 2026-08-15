import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { SecurityCheck, SecurityCheckStatus } from '@/lib/security'

const STATUS_STYLES: Record<
  SecurityCheckStatus,
  { wrap: string; icon: typeof CheckCircle2; label: string }
> = {
  pass: { wrap: 'bg-green-50 text-green-700', icon: CheckCircle2, label: 'Pass' },
  warn: { wrap: 'bg-amber-50 text-amber-700', icon: AlertTriangle, label: 'Warn' },
  fail: { wrap: 'bg-red-50 text-red-700', icon: XCircle, label: 'Fail' },
  info: { wrap: 'bg-gray-50 text-gray-600', icon: Info, label: 'Info' },
}

export default function SecurityCheckList({ checks }: { checks: SecurityCheck[] }) {
  return (
    <ul className="divide-y divide-gray-50">
      {checks.map((check) => {
        const style = STATUS_STYLES[check.status]
        const Icon = style.icon
        const body = (
          <div className="flex items-start gap-3 px-5 py-3.5">
            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.wrap}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-gray-800">{check.title}</p>
                <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${style.wrap}`}>
                  {style.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{check.detail}</p>
            </div>
          </div>
        )

        return (
          <li key={check.id}>
            {check.href ? (
              <Link href={check.href} className="block hover:bg-gray-50 transition">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ul>
  )
}
