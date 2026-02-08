'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { DashboardMetrics } from '@/types';

interface GlosasChartProps {
  data: DashboardMetrics['glosasBreakdown'];
}

const COLORS = ['hsl(224, 76%, 48%)', 'hsl(162, 63%, 41%)', 'hsl(38, 92%, 50%)'];
const LABELS: Record<string, string> = {
  administrativa: 'Administrativa',
  tecnica: 'Tecnica',
  linear: 'Linear',
};

export function GlosasChart({ data }: GlosasChartProps) {
  const chartData = data.map((item) => ({
    name: LABELS[item.type] || item.type,
    value: item.amount,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Glosas por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
