export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function SkeletonCircle({ size = "w-28 h-28" }: { size?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-full ${size}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dark-bg pb-24">
      <div className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <SkeletonLine className="w-16 h-5" />
          <SkeletonLine className="w-14 h-6" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
        {/* Hero skeleton */}
        <div className="rounded-3xl bg-white/5 p-6 space-y-3">
          <SkeletonLine className="w-28 h-4" />
          <SkeletonLine className="w-48 h-7" />
          <SkeletonLine className="w-36 h-4" />
          <SkeletonLine className="w-full h-2.5 mt-2" />
        </div>
        {/* Score + Insight */}
        <div className="rounded-3xl bg-white/5 p-4 flex items-center gap-3">
          <SkeletonCircle size="w-14 h-14" />
          <div className="flex-1 space-y-2"><SkeletonLine className="w-24 h-4" /><SkeletonLine className="w-32 h-3" /></div>
        </div>
        <div className="rounded-3xl bg-white/5 p-4 space-y-2">
          <SkeletonLine className="w-full h-4" /><SkeletonLine className="w-3/4 h-4" />
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1,2,3].map(i => <div key={i} className="rounded-3xl bg-white/5 p-4 space-y-2"><SkeletonLine className="w-8 h-8" /><SkeletonLine className="w-16 h-3" /></div>)}
        </div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-bg border-t border-white/5">
        <div className="max-w-lg mx-auto flex items-center justify-around py-3">
          {[1,2,3,4].map(i => <div key={i} className="flex flex-col items-center gap-1"><SkeletonLine className="w-5 h-5" /><SkeletonLine className="w-8 h-2" /></div>)}
        </div>
      </nav>
    </div>
  );
}
