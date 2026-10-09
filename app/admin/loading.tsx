export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Admin header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-800 rounded" />
          <div className="h-3.5 w-72 bg-zinc-900 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* KPI Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-28 bg-zinc-800 rounded" />
            <div className="h-7 w-20 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Table or Content skeleton */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <div className="h-5 w-40 bg-zinc-800 rounded" />
          <div className="h-8 w-48 bg-zinc-800 rounded-xl" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
