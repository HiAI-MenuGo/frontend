export default function KdsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-4 animate-pulse">
      {/* KDS Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-zinc-800 rounded" />
            <div className="h-3 w-64 bg-zinc-900 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
          <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 pb-2">
        <div className="h-8 w-20 bg-zinc-800 rounded-xl" />
        <div className="h-8 w-24 bg-zinc-900 rounded-xl" />
        <div className="h-8 w-24 bg-zinc-900 rounded-xl" />
      </div>

      {/* Orders Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="h-5 w-20 bg-zinc-800 rounded" />
              <div className="h-4 w-14 bg-zinc-800 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-800 rounded w-5/6" />
            </div>
            <div className="pt-3 border-t border-zinc-800 flex gap-2">
              <div className="h-9 bg-zinc-800 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
