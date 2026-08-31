export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <section className="bg-ob-navy py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="h-6 bg-white/10 rounded w-48" />
              <div className="h-12 bg-white/10 rounded w-full" />
              <div className="h-12 bg-white/10 rounded w-3/4" />
              <div className="h-5 bg-white/10 rounded w-full" />
              <div className="h-5 bg-white/10 rounded w-5/6" />
              <div className="flex gap-4 pt-4">
                <div className="h-12 bg-ob-lime/20 rounded-lg w-36" />
                <div className="h-12 bg-white/10 rounded-lg w-36" />
              </div>
            </div>
            <div className="h-80 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Trust strip skeleton */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <div className="h-4 bg-gray-100 rounded w-32 mx-auto" />
            <div className="h-8 bg-gray-100 rounded w-64 mx-auto" />
            <div className="h-5 bg-gray-100 rounded w-96 mx-auto" />
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="h-80 bg-gray-100 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-8 bg-gray-100 rounded w-64" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/6" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
