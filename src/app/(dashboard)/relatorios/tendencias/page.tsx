'use client';

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
import { ArrowLeft, Download } from 'lucide-react';
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
import { useState } from 'react';

// Sample trend data
const monthlyData = [
  { month: 'Jan', faturamento: 125000, glosas: 12500, pagamentos: 110000 },
  { month: 'Fev', faturamento: 132000, glosas: 15000, pagamentos: 115000 },
  { month: 'Mar', faturamento: 145000, glosas: 11000, pagamentos: 130000 },
  { month: 'Abr', faturamento: 138000, glosas: 18000, pagamentos: 118000 },
  { month: 'Mai', faturamento: 155000, glosas: 14000, pagamentos: 140000 },
  { month: 'Jun', faturamento: 162000, glosas: 16500, pagamentos: 145000 },
];

const glosasTrendData = [
  { month: 'Jan', administrativa: 5000, tecnica: 4500, linear: 3000 },
  { month: 'Fev', administrativa: 6000, tecnica: 5000, linear: 4000 },
  { month: 'Mar', administrativa: 4000, tecnica: 4000, linear: 3000 },
  { month: 'Abr', administrativa: 7000, tecnica: 6000, linear: 5000 },
  { month: 'Mai', administrativa: 5500, tecnica: 4500, linear: 4000 },
  { month: 'Jun', administrativa: 6500, tecnica: 5500, linear: 4500 },
];

export default function TendenciasPage() {
  const [periodo, setPeriodo] = useState('6m');

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
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolucao Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
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
                <BarChart data={glosasTrendData}>
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
                {formatCurrency(168000)}
              </div>
              <p className="text-xs text-muted-foreground">
                +3.7% em relacao ao mes atual
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
                {formatCurrency(17500)}
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado na tendencia dos ultimos 6 meses
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
              <div className="text-2xl font-bold">10.2%</div>
              <p className="text-xs text-muted-foreground">
                -0.5% em relacao ao periodo anterior
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
