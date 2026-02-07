'use client';

import { Button } from '@/components/ui/button';

export default function RelatoriosError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <h2 className="text-xl font-semibold">Erro ao carregar relatorios</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'Ocorreu um erro inesperado ao carregar os relatorios.'}
      </p>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
