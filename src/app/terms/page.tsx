import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Dubai Market',
  description: 'Terms governing use of the Dubai Market marketplace website and iOS app.',
}

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-amber prose-headings:text-gray-900">
      <p className="text-sm text-gray-500 mb-6">
        <Link href="/" className="text-amber-600 hover:underline">
          ← Back to Dubai Market
        </Link>
      </p>
      <h1>Terms of Service</h1>
      <p className="text-gray-500 text-sm">Last updated: August 4, 2026</p>

      <p>
        Welcome to Dubai Market. By accessing or using our website or iOS app (the
        &quot;Service&quot;), you agree to these Terms of Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Dubai Market is a peer-to-peer marketplace for buying and selling pre-owned items
        in Dubai. We provide listing, messaging, and related tools. We are not a party to
        transactions between buyers and sellers unless explicitly stated.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be legally able to form a binding contract in your jurisdiction and at
        least 13 years old (or older if required locally) to use the Service.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>Provide accurate registration information</li>
        <li>Keep your password confidential</li>
        <li>You are responsible for activity under your account</li>
        <li>We may suspend accounts that violate these terms</li>
      </ul>

      <h2>4. Listings &amp; conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>List illegal, stolen, counterfeit, or prohibited items</li>
        <li>Post misleading photos, prices, or descriptions</li>
        <li>Harass, spam, or scam other users</li>
        <li>Bypass fees or safety features if introduced later</li>
        <li>Scrape, attack, or reverse-engineer the Service</li>
      </ul>

      <h2>5. Transactions</h2>
      <p>
        Buyers and sellers arrange payment and meetup independently unless an in-app
        payment feature is enabled. Meet in safe public places. Inspect items before
        paying in cash. Dubai Market is not liable for failed meetups, item quality, or
        payment disputes between users.
      </p>

      <h2>6. Content license</h2>
      <p>
        You retain ownership of content you upload. You grant us a non-exclusive license
        to host, display, and distribute that content as needed to operate the Service.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Dubai Market name, branding, and software are owned by us or our licensors.
        You may not copy or reuse them without permission.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. We do not
        guarantee uninterrupted availability or that listings are accurate.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Dubai Market is not liable for indirect,
        incidental, or consequential damages arising from your use of the Service or from
        transactions with other users.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service at any time and may permanently delete your account
        from Settings. We may suspend or terminate access for violations of these terms or
        for risk to the community.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms. Continued use after changes means you accept the
        revised terms. Material changes will be reflected by updating the date above.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions:{' '}
        <a href="mailto:support@dubaimarket.app">support@dubaimarket.app</a>
        {' '}·{' '}
        <Link href="/support" className="text-amber-600 hover:underline">
          Support center
        </Link>
      </p>

      <p className="mt-10">
        See also our{' '}
        <Link href="/privacy" className="text-amber-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </article>
  )
}
