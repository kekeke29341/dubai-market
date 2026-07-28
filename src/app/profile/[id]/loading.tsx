export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-36 bg-gray-200 rounded-xl animate-pulse mt-1" />
        </div>
      </div>

      {/* Grid */}
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
