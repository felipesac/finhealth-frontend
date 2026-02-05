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
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Eye, Download } from 'lucide-react';
import type { MedicalAccount } from '@/types';

interface TissGuidesListProps {
  accounts: MedicalAccount[];
}

export function TissGuidesList({ accounts }: TissGuidesListProps) {
  const guidesAccounts = accounts.filter((a) => a.tiss_guide_number);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numero da Guia</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Validacao</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guidesAccounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-mono font-medium">
                {account.tiss_guide_number}
              </TableCell>
              <TableCell className="uppercase">
                {account.tiss_guide_type || '-'}
              </TableCell>
              <TableCell>
                <Link
                  href={`/contas/${account.id}`}
                  className="text-primary hover:underline"
                >
                  {account.account_number}
                </Link>
              </TableCell>
              <TableCell>{formatCurrency(account.total_amount)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    account.tiss_validation_status === 'valid'
                      ? 'default'
                      : account.tiss_validation_status === 'invalid'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {account.tiss_validation_status || 'Pendente'}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(account.created_at)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/tiss/viewer/${account.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {guidesAccounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhuma guia TISS encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
