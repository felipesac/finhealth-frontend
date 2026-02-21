import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { TissGuidesList } from '@/components/tiss';
import { Pagination } from '@/components/ui/pagination';
import { Upload } from 'lucide-react';
import type { MedicalAccount } from '@/types';

export const metadata: Metadata = {
  title: 'TISS | FinHealth',
  description: 'Gerencie as guias TISS e uploads de XML',
};

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getTissData(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  const { data: accounts, count } = await supabase
    .from('medical_accounts')
    .select('*', { count: 'exact' })
    .not('tiss_guide_number', 'is', null)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return {
    accounts: (accounts || []) as MedicalAccount[],
    total: count || 0,
  };
}

export default async function TissPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  let accounts: MedicalAccount[] = [];
  let total = 0;
  try {
    const data = await getTissData(page);
    accounts = data.accounts;
    total = data.total;
  } catch {
    // Supabase unavailable — render empty state
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">TISS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as guias TISS e uploads de XML
          </p>
        </div>
        <Link href="/tiss/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload XML
          </Button>
        </Link>
      </div>

      <TissGuidesList accounts={accounts} />
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
