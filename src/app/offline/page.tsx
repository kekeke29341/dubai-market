export const metadata = { title: 'Offline — Dubai Market' }

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re offline</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        It looks like you&apos;ve lost your internet connection. Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-full transition"
      >
        Try again
      </button>
    </div>
  )
}
