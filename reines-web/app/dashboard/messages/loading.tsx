export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] animate-pulse overflow-hidden rounded-2xl border border-zinc-200">
      {/* Sidebar */}
      <div className="w-full shrink-0 space-y-3 border-r border-zinc-100 bg-white p-4 sm:w-80">
        <div className="h-5 w-32 rounded-lg bg-zinc-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-lg bg-zinc-100" />
              <div className="h-3 w-1/2 rounded-lg bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
      {/* Main pane */}
      <div className="hidden flex-1 bg-zinc-50 sm:block" />
    </div>
  );
}
