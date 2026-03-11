import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import type { AppealStatus, GlosaType } from '@/types';

export const metadata: Metadata = {
  title: 'Glosas - Faturamento | FinHealth',
  description: 'Glosas vinculadas ao faturamento',
};

const statusLabels: Record<AppealStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Recurso',
  sent: 'Enviado',
  accepted: 'Aceita',
  rejected: 'Rejeitada',
};

const statusVariants: Record<AppealStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  in_progress: 'secondary',
  sent: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

const tipoLabels: Record<GlosaType, string> = {
  administrativa: 'Administrativa',
  tecnica: 'Tecnica',
  linear: 'Linear',
};

interface GlosaFaturamento {
  id: string;
  glosa_code: string;
  glosa_type: string | null;
  original_amount: number;
  glosa_amount: number;
  appeal_status: string | null;
  created_at: string;
  medical_account: { account_number: string } | null;
}

async function getGlosasFaturamento(): Promise<GlosaFaturamento[]> {
  const supabase = await createClient();

  const { data: glosas } = await supabase
    .from('glosas')
    .select(`
      id,
      glosa_code,
      glosa_type,
      original_amount,
      glosa_amount,
      appeal_status,
      created_at,
      medical_account:medical_accounts(account_number)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return (glosas || []) as unknown as GlosaFaturamento[];
}

export default async function GlosasFaturamentoPage() {
  let glosas: GlosaFaturamento[] = [];
  try {
    glosas = await getGlosasFaturamento();
  } catch {
    // Supabase unavailable — render empty state
  }

  const totals = glosas.reduce(
    (acc, g) => ({
      original: acc.original + (g.original_amount || 0),
      glosado: acc.glosado + (g.glosa_amount || 0),
      recuperado:
        acc.recuperado +
        (g.appeal_status === 'accepted' ? g.glosa_amount || 0 : 0),
    }),
    { original: 0, glosado: 0, recuperado: 0 }
  );

  const taxaGlosa = totals.original > 0
    ? ((totals.glosado / totals.original) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Glosas - Faturamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Glosas vinculadas ao faturamento com status de recurso
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Original</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.original)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Glosado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.glosado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recuperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.recuperado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Glosa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaGlosa}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Glosas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor Original</TableHead>
                <TableHead className="text-right">Valor Glosado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glosas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma glosa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                glosas.map((glosa) => (
                  <TableRow key={glosa.id}>
                    <TableCell className="font-medium">
                      {glosa.medical_account?.account_number || '-'}
                    </TableCell>
                    <TableCell>{glosa.glosa_code}</TableCell>
                    <TableCell>
                      {glosa.glosa_type ? tipoLabels[glosa.glosa_type as GlosaType] : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(glosa.original_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(glosa.glosa_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[glosa.appeal_status as AppealStatus]}>
                        {statusLabels[glosa.appeal_status as AppealStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(glosa.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
