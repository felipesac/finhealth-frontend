'use client';

import { Button } from '@/components/ui/button';

export default function ContasError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4 sm:py-16">
      <h2 className="text-xl font-semibold tracking-tight">Erro ao carregar contas</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'Ocorreu um erro inesperado ao carregar as contas medicas.'}
      </p>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
