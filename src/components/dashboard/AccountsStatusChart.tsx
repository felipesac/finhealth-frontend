'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatusCount {
  status: string;
  count: number;
  label: string;
}

interface AccountsStatusChartProps {
  data: StatusCount[];
}

const statusColors: Record<string, string> = {
  pending: 'hsl(38, 92%, 50%)',
  validated: 'hsl(224, 76%, 48%)',
  sent: 'hsl(262, 52%, 47%)',
  paid: 'hsl(162, 63%, 41%)',
  glosa: 'hsl(0, 84%, 60%)',
  appeal: 'hsl(25, 95%, 53%)',
};

interface TooltipPayload {
  payload: StatusCount;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{item.label}</p>
      <p className="text-sm text-muted-foreground">{item.count} conta(s)</p>
    </div>
  );
}

export function AccountsStatusChart({ data }: AccountsStatusChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Contas por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="label" type="category" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={statusColors[entry.status] || 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
