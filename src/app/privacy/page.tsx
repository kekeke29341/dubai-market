import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Dubai Market',
  description: 'How Dubai Market collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-amber prose-headings:text-gray-900">
      <p className="text-sm text-gray-500 mb-6">
        <Link href="/" className="text-amber-600 hover:underline">
          ← Back to Dubai Market
        </Link>
      </p>
      <h1>Privacy Policy</h1>
      <p className="text-gray-500 text-sm">Last updated: August 4, 2026</p>

      <p>
        Dubai Market (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Dubai Market website and
        iOS application (the &quot;Service&quot;). This policy explains what information we
        collect and how we use it.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — email address, username, display name, bio,
          location, and profile photo when you register or update your profile.
        </li>
        <li>
          <strong>Listing data</strong> — item titles, descriptions, prices, photos, and
          condition you upload when selling.
        </li>
        <li>
          <strong>Messages</strong> — buyer–seller chat content sent through the Service.
        </li>
        <li>
          <strong>Usage data</strong> — pages viewed, device type, approximate location
          derived from IP, and crash/diagnostic information.
        </li>
        <li>
          <strong>Device permissions (iOS app)</strong> — camera and photo library access
          only when you choose to upload images; network status to detect offline mode.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, maintain, and improve the marketplace</li>
        <li>Authenticate users and secure accounts</li>
        <li>Enable messaging, favorites, offers, and notifications</li>
        <li>Detect fraud, abuse, and policy violations</li>
        <li>Respond to support requests</li>
      </ul>

      <h2>3. Sharing</h2>
      <p>
        We do not sell your personal information. We share data only with:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> such as Supabase (database, auth, storage)
          and Vercel (hosting), who process data on our behalf.
        </li>
        <li>
          <strong>Other users</strong> — your public profile and active listings are visible
          to other members of the Service.
        </li>
        <li>
          <strong>Legal requirements</strong> when required by law or to protect rights and safety.
        </li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We retain account and listing data while your account is active. You may request
        deletion by contacting us. Some records may be kept longer when required for legal,
        security, or dispute-resolution purposes.
      </p>

      <h2>5. Security</h2>
      <p>
        We use industry-standard safeguards including encrypted transport (HTTPS),
        authenticated access controls, and row-level security on our database. No method
        of transmission is 100% secure.
      </p>

      <h2>6. Children</h2>
      <p>
        The Service is not directed to children under 13 (or the minimum age required in
        your jurisdiction). We do not knowingly collect personal information from children.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Update profile information in Settings</li>
        <li>Delete listings you own</li>
        <li>Sign out or delete your account in Settings (Settings → Delete account)</li>
        <li>Control notification preferences where available</li>
      </ul>

      <h2>8. International users</h2>
      <p>
        Dubai Market is focused on Dubai / UAE. Your information may be processed in
        regions where our infrastructure providers operate.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy:{' '}
        <a href="mailto:support@dubaimarket.app">support@dubaimarket.app</a>
        {' '}or visit our{' '}
        <Link href="/support" className="text-amber-600 hover:underline">
          Support
        </Link>{' '}
        page.
      </p>

      <p className="mt-10">
        See also our{' '}
        <Link href="/terms" className="text-amber-600 hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </article>
  )
}
