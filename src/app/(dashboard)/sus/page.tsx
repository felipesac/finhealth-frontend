import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building2, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SUS | FinHealth',
  description: 'Modulo de faturamento SUS - BPA, AIH e tabela SIGTAP',
};

const susModules = [
  {
    href: '/sus/bpa',
    title: 'BPA',
    description: 'Boletim de Producao Ambulatorial. Registre e gerencie procedimentos ambulatoriais SUS.',
    icon: FileText,
  },
  {
    href: '/sus/aih',
    title: 'AIH',
    description: 'Autorizacao de Internacao Hospitalar. Gerencie internacoes e faturamento hospitalar.',
    icon: Building2,
  },
  {
    href: '/sus/sigtap',
    title: 'SIGTAP',
    description: 'Consulte procedimentos na tabela SIGTAP com valores atualizados.',
    icon: Search,
  },
];

export default function SusPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Faturamento SUS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie BPA, AIH e consulte a tabela SIGTAP
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {susModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href} className="group">
              <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{mod.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {mod.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
