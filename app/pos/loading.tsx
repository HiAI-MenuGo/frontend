export default function PosLoading() {
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden animate-pulse">
      {/* Top Header skeleton */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-800" />
          <div className="h-5 w-32 bg-zinc-800 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
          <div className="h-8 w-28 bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Main split skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left items/tables panel */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden border-r border-zinc-800">
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-zinc-800 rounded-xl" />
            <div className="h-9 w-28 bg-zinc-900 rounded-xl" />
            <div className="h-9 w-28 bg-zinc-900 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="h-20 bg-zinc-800 rounded-xl" />
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* Right checkout order summary panel */}
        <div className="w-96 bg-zinc-900/60 p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-4">
            <div className="h-6 w-36 bg-zinc-800 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-800/60 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="h-4 bg-zinc-800 rounded w-full" />
            <div className="h-6 bg-zinc-800 rounded w-3/4" />
            <div className="h-11 bg-zinc-800 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
