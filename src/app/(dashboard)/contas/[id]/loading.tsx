export default function ContaDetailLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-7 w-48 sm:h-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
