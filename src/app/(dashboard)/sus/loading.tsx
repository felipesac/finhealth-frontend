import { Loader2 } from 'lucide-react';

export default function SusLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 sm:h-8 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 sm:w-72 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
