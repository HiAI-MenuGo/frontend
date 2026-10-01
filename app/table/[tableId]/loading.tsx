export default function TableMenuLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-14 bg-zinc-900 rounded-2xl border border-zinc-800" />
      <div className="h-8 bg-zinc-900 rounded-xl border border-zinc-800 w-2/3" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="h-32 bg-zinc-800" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
