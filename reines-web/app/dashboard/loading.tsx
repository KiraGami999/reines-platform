export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="h-8 w-48 rounded-xl bg-zinc-100" />
      <div className="h-4 w-72 rounded-lg bg-zinc-100" />

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-100" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
