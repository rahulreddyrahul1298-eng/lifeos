export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-md ${className}`} />;
}

export function SkeletonCircle({ size = "w-28 h-28" }: { size?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-full ${size}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <SkeletonLine className="w-20 h-5" />
          <SkeletonLine className="w-16 h-7" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
        {/* Greeting + Score */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonLine className="w-40 h-6" />
            <SkeletonLine className="w-28 h-4" />
          </div>
          <SkeletonCircle size="w-16 h-16" />
        </div>

        {/* Hero card */}
        <div className="card p-5 space-y-3">
          <SkeletonLine className="w-32 h-4" />
          <SkeletonLine className="w-full h-10" />
          <SkeletonLine className="w-full h-10" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 space-y-2">
              <SkeletonLine className="w-full h-5" />
              <SkeletonLine className="w-16 h-3" />
            </div>
          ))}
        </div>

        {/* Insight cards */}
        <div className="card p-4 space-y-2">
          <SkeletonLine className="w-full h-4" />
          <SkeletonLine className="w-3/4 h-4" />
        </div>
        <div className="card p-4 space-y-2">
          <SkeletonLine className="w-full h-4" />
          <SkeletonLine className="w-2/3 h-4" />
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto flex items-center justify-around py-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <SkeletonLine className="w-5 h-5" />
              <SkeletonLine className="w-8 h-2" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
