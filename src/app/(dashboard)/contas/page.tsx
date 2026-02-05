import { createClient } from '@/lib/supabase/server';
import { AccountsTable, AccountFilters } from '@/components/accounts';
import type { MedicalAccount, HealthInsurer } from '@/types';

async function getAccountsData() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select(`
      *,
      patient:patients(name),
      health_insurer:health_insurers(name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: insurers } = await supabase
    .from('health_insurers')
    .select('*')
    .eq('active', true)
    .order('name');

  return {
    accounts: (accounts || []) as MedicalAccount[],
    insurers: (insurers || []) as HealthInsurer[],
  };
}

export default async function ContasPage() {
  const { accounts, insurers } = await getAccountsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contas Medicas</h1>
        <p className="text-muted-foreground">
          Gerencie as contas medicas e guias TISS
        </p>
      </div>

      <AccountFilters insurers={insurers} />
      <AccountsTable accounts={accounts} />
    </div>
  );
}
