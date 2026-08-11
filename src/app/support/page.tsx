import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support — Dubai Market',
  description: 'Get help with the Dubai Market website and iOS app.',
}

export default function SupportPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-amber prose-headings:text-gray-900">
      <p className="text-sm text-gray-500 mb-6">
        <Link href="/" className="text-amber-600 hover:underline">
          ← Back to Dubai Market
        </Link>
      </p>
      <h1>Support</h1>
      <p className="text-gray-500 text-sm">Dubai Market help center</p>

      <p>
        Need help with browsing listings, posting items, messaging, or the iOS app?
        We are happy to help.
      </p>

      <h2>Contact</h2>
      <ul>
        <li>
          Email:{' '}
          <a href="mailto:support@dubaimarket.app">support@dubaimarket.app</a>
        </li>
        <li>
          In-app: open <Link href="/mypage/settings">Settings</Link> → Contact support
        </li>
      </ul>

      <h2>Common topics</h2>
      <ul>
        <li>
          <strong>Account</strong> — update your profile in Settings, or delete your account
          permanently from the same page (required confirmation).
        </li>
        <li>
          <strong>Listings</strong> — create or edit posts from Sell / My Page. Uploads use
          your camera or photo library on iOS.
        </li>
        <li>
          <strong>Messages</strong> — conversations live under Messages. Report abuse from
          a listing when needed.
        </li>
        <li>
          <strong>iOS app</strong> — pull down to refresh, use offline retry when the
          network drops, and open shared <code>dubai-market://</code> links in the app.
        </li>
      </ul>

      <h2>Legal</h2>
      <ul>
        <li>
          <Link href="/privacy">Privacy Policy</Link>
        </li>
        <li>
          <Link href="/terms">Terms of Service</Link>
        </li>
      </ul>

      <p className="text-sm text-gray-500 not-prose mt-10">
        We aim to respond to support email within 2 business days.
      </p>
    </article>
  )
}
