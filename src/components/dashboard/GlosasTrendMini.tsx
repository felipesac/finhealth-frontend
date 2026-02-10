'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface MonthlyGlosa {
  month: string;
  amount: number;
}

interface GlosasTrendMiniProps {
  data: MonthlyGlosa[];
}

function MiniTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded border bg-background px-2 py-1 shadow-sm text-xs">
      <p>{label}: {formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function GlosasTrendMini({ data }: GlosasTrendMiniProps) {
  if (!data || data.length < 2) return null;

  const lastMonth = data[data.length - 1];
  const prevMonth = data[data.length - 2];
  const trend = lastMonth.amount > prevMonth.amount ? 'up' : 'down';

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Tendencia de Glosas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(lastMonth.amount)}</p>
            <p className={`text-xs ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
              {trend === 'up' ? 'Aumento' : 'Reducao'} vs mes anterior
            </p>
          </div>
          <div className="flex-1 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={trend === 'up' ? 'hsl(var(--chart-5))' : 'hsl(var(--chart-2))'}
                  strokeWidth={2}
                  dot={false}
                />
                <Tooltip content={<MiniTooltip />} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
