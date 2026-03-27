export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} />;
}
export function SkeletonCircle({ size = "w-14 h-14" }: { size?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-full ${size}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          <SkeletonLine className="w-16 h-5" /><SkeletonLine className="w-14 h-7" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        <div className="card p-7 space-y-3"><SkeletonLine className="w-28 h-4" /><SkeletonLine className="w-52 h-7" /><SkeletonLine className="w-40 h-4" /><SkeletonLine className="w-full h-2.5 mt-2" /></div>
        <div className="card p-5 flex items-center gap-4"><SkeletonCircle /><div className="flex-1 space-y-2"><SkeletonLine className="w-24 h-4" /><SkeletonLine className="w-36 h-3" /></div></div>
        <div className="card p-5 space-y-2"><SkeletonLine className="w-full h-4" /><SkeletonLine className="w-3/4 h-4" /></div>
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="card p-4 space-y-2"><SkeletonLine className="w-8 h-8" /><SkeletonLine className="w-16 h-3" /></div>)}</div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto flex items-center justify-around py-3">{[1,2,3,4].map(i=><div key={i} className="flex flex-col items-center gap-1"><SkeletonLine className="w-5 h-5" /><SkeletonLine className="w-8 h-2" /></div>)}</div>
      </nav>
    </div>
  );
}
