'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Glosa, AppealStatus, GlosaType } from '@/types';

interface GlosasTableProps {
  glosas: Glosa[];
}

const appealStatusConfig: Record<AppealStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'outline' },
  sent: { label: 'Enviado', variant: 'default' },
  accepted: { label: 'Aceito', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
};

const glosaTypeLabels: Record<GlosaType, string> = {
  administrativa: 'Administrativa',
  tecnica: 'Tecnica',
  linear: 'Linear',
};

export function GlosasTable({ glosas }: GlosasTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Codigo</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor Original</TableHead>
            <TableHead>Valor Glosado</TableHead>
            <TableHead>Probabilidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {glosas.map((glosa) => {
            const status = appealStatusConfig[glosa.appeal_status];
            return (
              <TableRow key={glosa.id}>
                <TableCell>
                  <Link
                    href={`/glosas/${glosa.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {glosa.glosa_code}
                  </Link>
                </TableCell>
                <TableCell>
                  {glosa.medical_account?.account_number || '-'}
                </TableCell>
                <TableCell>
                  {glosa.glosa_type ? glosaTypeLabels[glosa.glosa_type] : '-'}
                </TableCell>
                <TableCell>{formatCurrency(glosa.original_amount)}</TableCell>
                <TableCell className="text-destructive font-medium">
                  {formatCurrency(glosa.glosa_amount)}
                </TableCell>
                <TableCell>
                  {glosa.success_probability !== undefined && (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={glosa.success_probability * 100}
                        className="h-2 w-16"
                      />
                      <span className="text-sm">
                        {(glosa.success_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>{formatDate(glosa.created_at)}</TableCell>
              </TableRow>
            );
          })}
          {glosas.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nenhuma glosa encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
