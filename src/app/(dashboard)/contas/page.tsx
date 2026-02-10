import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AccountsTable, AccountFilters } from '@/components/accounts';
import { Pagination } from '@/components/ui/pagination';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { MedicalAccount, HealthInsurer } from '@/types';

export const metadata: Metadata = {
  title: 'Contas Medicas | FinHealth',
  description: 'Gerencie as contas medicas e guias TISS',
};

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    type?: string;
    insurerId?: string;
    search?: string;
  }>;
}

async function getAccountsData(page: number, filters: {
  status?: string;
  type?: string;
  insurerId?: string;
  search?: string;
}) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('medical_accounts')
    .select(`
      *,
      patient:patients(name),
      health_insurer:health_insurers(name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('account_type', filters.type);
  }
  if (filters.insurerId && filters.insurerId !== 'all') {
    query = query.eq('health_insurer_id', filters.insurerId);
  }
  if (filters.search) {
    query = query.ilike('account_number', `%${filters.search}%`);
  }

  const { data: accounts, count } = await query.range(from, from + PAGE_SIZE - 1);

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
  const t = await getTranslations('accounts');
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const filters = {
    status: params.status,
    type: params.type,
    insurerId: params.insurerId,
    search: params.search,
  };
  const { accounts, insurers, total } = await getAccountsData(page, filters);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <AccountFilters insurers={insurers} />
      <ErrorBoundary fallbackMessage={t('errorLoading')}>
        <AccountsTable accounts={accounts} />
      </ErrorBoundary>
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
