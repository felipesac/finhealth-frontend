'use client';

import { Button } from '@/components/ui/button';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-xl font-semibold">Erro ao carregar usuarios</h2>
      <p className="text-sm text-muted-foreground">Ocorreu um erro inesperado.</p>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
