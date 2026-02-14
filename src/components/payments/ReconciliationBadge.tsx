import { Badge } from '@/components/ui/badge';

interface ReconciliationBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  partial: { label: 'Parcial', variant: 'outline' },
  matched: { label: 'Conciliado', variant: 'default' },
  divergent: { label: 'Divergente', variant: 'destructive' },
};

export function ReconciliationBadge({ status }: ReconciliationBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
