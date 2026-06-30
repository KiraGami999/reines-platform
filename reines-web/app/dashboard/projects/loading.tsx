export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-zinc-100" />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100" />
        ))}
      </div>

      {/* Filter tabs */}
      <div className="h-11 rounded-xl bg-zinc-100" />

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
