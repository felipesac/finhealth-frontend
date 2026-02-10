'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { formatCurrency } from '@/lib/formatters';

const TendenciasCharts = dynamic(
  () => import('@/components/reports/TendenciasCharts').then((m) => m.TendenciasCharts),
  { ssr: false, loading: () => (
    <div className="grid gap-4 sm:gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  )},
);

interface MonthlyData {
  month: string;
  faturamento: number;
  glosas: number;
  pagamentos: number;
}

interface GlosasTrendData {
  month: string;
  administrativa: number;
  tecnica: number;
  linear: number;
}

interface Forecast {
  nextMonthBilling: number;
  billingGrowth: number;
  estimatedGlosaRisk: number;
  averageGlosaRate: number;
}

interface TrendsResponse {
  monthlyData: MonthlyData[];
  glosasTrendData: GlosasTrendData[];
  forecast: Forecast;
}

const periodMonths: Record<string, number> = { '3m': 3, '6m': 6, '12m': 12 };

export default function TendenciasPage() {
  const [periodo, setPeriodo] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrendsResponse | null>(null);

  const handleExport = () => {
    if (!data) return;
    const rows = data.monthlyData.map((m) =>
      [m.month, m.faturamento, m.glosas, m.pagamentos].join(',')
    );
    const csv = ['Mes,Faturamento,Glosas,Pagamentos', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finhealth-tendencias-${periodo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trends?months=${periodMonths[periodo] || 6}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [periodo]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/relatorios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tendencias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analise de tendencias e previsoes financeiras
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[130px] sm:w-[150px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-muted-foreground">
          Erro ao carregar dados de tendencias.
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          <TendenciasCharts
            monthlyData={data.monthlyData}
            glosasTrendData={data.glosasTrendData}
          />

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Previsao Proximo Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.forecast.nextMonthBilling)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.forecast.billingGrowth >= 0 ? '+' : ''}
                  {data.forecast.billingGrowth.toFixed(1)}% em relacao ao mes atual
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Risco de Glosa Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.forecast.estimatedGlosaRisk)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado na media dos ultimos {periodMonths[periodo] || 6} meses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa Media de Glosa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.forecast.averageGlosaRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentual medio do periodo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
