import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, TrendingUp, FileSpreadsheet } from 'lucide-react';

const reports = [
  {
    title: 'Faturamento Mensal',
    description: 'Relatorio de faturamento por periodo e operadora',
    href: '/relatorios/faturamento',
    icon: BarChart3,
  },
  {
    title: 'Glosas por Operadora',
    description: 'Analise de glosas agrupadas por operadora de saude',
    href: '/relatorios/glosas-operadora',
    icon: PieChart,
  },
  {
    title: 'Tendencias',
    description: 'Analise de tendencias e previsoes',
    href: '/relatorios/tendencias',
    icon: TrendingUp,
  },
  {
    title: 'Exportar Dados',
    description: 'Exporte dados para Excel ou PDF',
    href: '/relatorios/exportar',
    icon: FileSpreadsheet,
  },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatorios</h1>
        <p className="text-muted-foreground">
          Acesse relatorios e analises financeiras
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
