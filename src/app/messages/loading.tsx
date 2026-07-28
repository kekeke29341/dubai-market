export default function MessagesLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse -ml-4 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
