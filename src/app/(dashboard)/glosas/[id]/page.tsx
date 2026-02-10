import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Detalhes da Glosa | FinHealth',
  description: 'Detalhes da glosa e recurso',
};
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { AppealForm } from '@/components/glosas/AppealForm';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { Glosa, AppealStatus, GlosaType } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
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

async function getGlosaData(id: string) {
  const supabase = await createClient();

  const { data: glosa } = await supabase
    .from('glosas')
    .select(`
      *,
      medical_account:medical_accounts(
        account_number,
        patient:patients(name),
        health_insurer:health_insurers(name)
      ),
      procedure:procedures(description, tuss_code)
    `)
    .eq('id', id)
    .single();

  return glosa as Glosa | null;
}

export default async function GlosaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const glosa = await getGlosaData(id);

  if (!glosa) {
    notFound();
  }

  const status = appealStatusConfig[glosa.appeal_status];
  const successPercentage = (glosa.success_probability || 0) * 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/glosas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Glosa {glosa.glosa_code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {glosa.glosa_description || 'Detalhes da glosa'}
          </p>
        </div>
        <div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacoes da Glosa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Codigo</p>
                <p className="font-medium">{glosa.glosa_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {glosa.glosa_type ? glosaTypeLabels[glosa.glosa_type] : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conta</p>
                <p className="font-medium">
                  {glosa.medical_account?.account_number || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(glosa.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Original</p>
                <p className="text-xl font-bold">{formatCurrency(glosa.original_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Glosado</p>
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(glosa.glosa_amount)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Probabilidade de Sucesso no Recurso
              </p>
              <div className="flex items-center gap-4">
                <Progress value={successPercentage} className="flex-1" />
                <span className="text-lg font-bold">{successPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {glosa.ai_recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Recomendacao da IA
            </CardTitle>
            <CardDescription>
              Sugestao gerada automaticamente para o recurso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <p className="whitespace-pre-wrap">{glosa.ai_recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <ErrorBoundary fallbackMessage="Erro ao carregar formulario de recurso.">
        <AppealForm
          glosaId={glosa.id}
          initialText={glosa.appeal_text || glosa.ai_recommendation || ''}
          appealStatus={glosa.appeal_status}
        />
      </ErrorBoundary>
    </div>
  );
}
