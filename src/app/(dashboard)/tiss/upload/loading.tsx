export default function TissUploadLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 sm:h-8 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 sm:w-72 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
