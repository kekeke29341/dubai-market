export default function ItemDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Breadcrumb */}
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery skeleton */}
        <div className="flex flex-col gap-2">
          <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-9 w-1/3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
          {/* Seller card skeleton */}
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          {/* Actions skeleton */}
          <div className="flex gap-2">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
