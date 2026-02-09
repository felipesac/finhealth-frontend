import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { InsurerManagement } from '@/components/admin/InsurerManagement';

export const metadata: Metadata = {
  title: 'Operadoras | FinHealth',
  description: 'Gerenciamento de operadoras de saude',
};

export default async function OperadorasPage() {
  const supabase = await createClient();
  const { data: insurers } = await supabase
    .from('health_insurers')
    .select('*')
    .order('name');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Operadoras</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerenciamento de operadoras de saude</p>
      </div>
      <InsurerManagement initialInsurers={insurers || []} />
    </div>
  );
}
