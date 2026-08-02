export default function MissingEnvBanner() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Supabase environment variables required
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          This app is deployed, but Supabase credentials are not set on Vercel yet.
          Add the following in{' '}
          <span className="font-medium">Vercel → Project → Settings → Environment Variables</span>
          , then redeploy:
        </p>
        <ul className="text-sm font-mono text-gray-800 space-y-1 mb-4">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="text-sm text-gray-600">
          Get them from{' '}
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            className="text-amber-700 underline"
            target="_blank"
            rel="noreferrer"
          >
            Supabase → Project Settings → API
          </a>
          . See <code className="text-xs bg-white px-1 py-0.5 rounded">.env.local.example</code>.
        </p>
      </div>
    </div>
  )
}
