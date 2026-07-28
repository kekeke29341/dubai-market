export default function RootLoading() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
      {/* Category bar skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 h-9 w-24 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Item grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
