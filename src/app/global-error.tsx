'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <h2 className="text-2xl font-semibold">Algo deu errado</h2>
          <p className="text-sm text-gray-500">
            Um erro inesperado ocorreu. Nossa equipe foi notificada.
          </p>
          <Button onClick={reset}>Tentar Novamente</Button>
        </div>
      </body>
    </html>
  );
}
