import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ArrowLeft } from 'lucide-react';
import { CreateAccountForm } from '@/components/accounts/CreateAccountForm';

export const metadata: Metadata = {
  title: 'Nova Conta Medica | FinHealth',
  description: 'Criar nova conta medica',
};

async function getFormData() {
  const supabase = await createClient();

  const [patientsRes, insurersRes] = await Promise.all([
    supabase
      .from('patients')
      .select('id, name')
      .order('name', { ascending: true })
      .limit(500),
    supabase
      .from('health_insurers')
      .select('id, name')
      .eq('active', true)
      .order('name', { ascending: true }),
  ]);

  return {
    patients: (patientsRes.data || []) as { id: string; name: string }[],
    insurers: (insurersRes.data || []) as { id: string; name: string }[],
  };
}

export default async function NovaContaPage() {
  let patients: { id: string; name: string }[] = [];
  let insurers: { id: string; name: string }[] = [];
  try {
    const data = await getFormData();
    patients = data.patients;
    insurers = data.insurers;
  } catch {
    // Supabase unavailable — render empty form
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/contas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nova Conta Medica</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os dados para criar uma nova conta medica
          </p>
        </div>
      </div>

      <ErrorBoundary fallbackMessage="Erro ao carregar formulario.">
        <CreateAccountForm patients={patients} insurers={insurers} />
      </ErrorBoundary>
    </div>
  );
}
