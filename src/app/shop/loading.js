export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-full w-24" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-100" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
