import { Badge } from '@/components/ui/badge';
import type { AccountStatus } from '@/types';

interface StatusBadgeProps {
  status: AccountStatus;
}

const statusConfig: Record<AccountStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  validated: { label: 'Validada', variant: 'outline' },
  sent: { label: 'Enviada', variant: 'default' },
  paid: { label: 'Paga', variant: 'default' },
  glosa: { label: 'Glosada', variant: 'destructive' },
  appeal: { label: 'Em Recurso', variant: 'secondary' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
