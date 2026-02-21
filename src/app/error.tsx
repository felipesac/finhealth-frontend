'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Application error boundary triggered', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Erro Inesperado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente.
        </p>
      </div>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
