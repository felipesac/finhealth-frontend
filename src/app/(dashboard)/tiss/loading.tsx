import { Loader2 } from 'lucide-react';

export default function TISSLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 sm:h-8 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 sm:w-72 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-lg border bg-card" />
        <div className="h-48 animate-pulse rounded-lg border bg-card" />
      </div>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
