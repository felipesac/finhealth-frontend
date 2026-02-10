'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TendenciasChartsProps {
  monthlyData: MonthlyData[];
  glosasTrendData: GlosasTrendData[];
}

export function TendenciasCharts({ monthlyData, glosasTrendData }: TendenciasChartsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Evolucao Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[350px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
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
                  stroke="hsl(224, 76%, 48%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="glosas"
                  name="Glosas"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pagamentos"
                  name="Pagamentos"
                  stroke="hsl(162, 63%, 41%)"
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
          <div className="h-[280px] sm:h-[350px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={glosasTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
                <Bar dataKey="administrativa" name="Administrativa" fill="hsl(0, 84%, 60%)" />
                <Bar dataKey="tecnica" name="Tecnica" fill="hsl(38, 92%, 50%)" />
                <Bar dataKey="linear" name="Linear" fill="hsl(224, 76%, 48%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
