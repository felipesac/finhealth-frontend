import { Loader2 } from 'lucide-react';

export default function GlosasOperadoraReportLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 sm:h-8 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 sm:w-72 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="rounded-xl border border-border/60">
        <div className="h-10 border-b bg-muted/50" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-12 items-center border-b px-4 gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
