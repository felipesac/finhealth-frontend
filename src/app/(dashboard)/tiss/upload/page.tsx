import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { TissUploadForm } from '@/components/tiss';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Upload TISS | FinHealth',
  description: 'Envie um arquivo XML TISS para validacao',
};

async function getAccounts() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('medical_accounts')
    .select('id, account_number, patient:patients(name)')
    .in('status', ['pending', 'validated'])
    .order('created_at', { ascending: false })
    .limit(100);

  return (data || []).map((row) => {
    const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
    return {
      id: row.id as string,
      account_number: row.account_number as string,
      patient_name: (patient as { name: string } | null)?.name,
    };
  });
}

export default async function TissUploadPage() {
  let accounts: { id: string; account_number: string; patient_name?: string }[] = [];
  try {
    accounts = await getAccounts();
  } catch {
    // Supabase unavailable — render empty form
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/tiss">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Upload de Guia TISS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie um arquivo XML para validacao
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <TissUploadForm accounts={accounts} />
      </div>
    </div>
  );
}
