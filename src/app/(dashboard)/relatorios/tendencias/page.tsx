'use client';

import { useEffect, useState } from 'react';
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/relatorios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Tendencias</h1>
          <p className="text-muted-foreground">
            Analise de tendencias e previsoes financeiras
          </p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[150px]">
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
          Exportar
        </Button>
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
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolucao Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="faturamento"
                      name="Faturamento"
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="glosas"
                      name="Glosas"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="pagamentos"
                      name="Pagamentos"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Glosas por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.glosasTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Bar dataKey="administrativa" name="Administrativa" fill="#ef4444" />
                    <Bar dataKey="tecnica" name="Tecnica" fill="#f97316" />
                    <Bar dataKey="linear" name="Linear" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
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
