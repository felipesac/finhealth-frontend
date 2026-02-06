import { createClient } from '@/lib/supabase/server';
import { AccountsTable, AccountFilters } from '@/components/accounts';
import { Pagination } from '@/components/ui/pagination';
import type { MedicalAccount, HealthInsurer } from '@/types';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getAccountsData(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  const { data: accounts, count } = await supabase
    .from('medical_accounts')
    .select(`
      *,
      patient:patients(name),
      health_insurer:health_insurers(name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const { data: insurers } = await supabase
    .from('health_insurers')
    .select('*')
    .eq('active', true)
    .order('name');

  return {
    accounts: (accounts || []) as MedicalAccount[],
    insurers: (insurers || []) as HealthInsurer[],
    total: count || 0,
  };
}

export default async function ContasPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const { accounts, insurers, total } = await getAccountsData(page);

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
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
