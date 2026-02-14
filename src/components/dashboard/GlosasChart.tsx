'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { DashboardMetrics } from '@/types';

interface GlosasChartProps {
  data: DashboardMetrics['glosasBreakdown'];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
const LABELS: Record<string, string> = {
  administrativa: 'Adm',
  tecnica: 'Tec',
  linear: 'Lin',
};
const LABELS_FULL: Record<string, string> = {
  administrativa: 'Administrativa',
  tecnica: 'Tecnica',
  linear: 'Linear',
};

export function GlosasChart({ data }: GlosasChartProps) {
  const [containerWidth, setContainerWidth] = useState(300);

  const handleResize = useCallback((width: number) => {
    setContainerWidth(width);
  }, []);

  const chartData = data.map((item) => ({
    name: containerWidth < 400 ? (LABELS[item.type] || item.type) : (LABELS_FULL[item.type] || item.type),
    value: item.amount,
    count: item.count,
  }));

  const outerRadius = Math.min(80, containerWidth / 3.5);
  const showLabels = containerWidth >= 350;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Glosas por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%" onResize={handleResize}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="value"
                label={showLabels ? ({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                : undefined}
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
