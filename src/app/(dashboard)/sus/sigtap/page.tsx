import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SigtapSearch } from '@/components/sus';

export const metadata: Metadata = {
  title: 'SIGTAP | FinHealth',
  description: 'Consulta de procedimentos na tabela SIGTAP do SUS',
};

export default function SigtapPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/sus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tabela SIGTAP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte procedimentos e valores da tabela SUS
          </p>
        </div>
      </div>

      <SigtapSearch />
    </div>
  );
}
