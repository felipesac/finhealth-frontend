'use client';

import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('[Dashboard Error]', error.message, error.stack);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4 sm:py-16">
      <h2 className="text-xl font-semibold tracking-tight">Erro ao carregar dashboard</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'Ocorreu um erro inesperado.'}
      </p>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
