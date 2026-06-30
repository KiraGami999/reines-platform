export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-zinc-100" />
        <div className="space-y-1.5">
          <div className="h-6 w-32 rounded-lg bg-zinc-100" />
          <div className="h-4 w-48 rounded-lg bg-zinc-100" />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
