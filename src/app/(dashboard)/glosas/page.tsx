import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlosasTable } from '@/components/glosas';
import { Pagination } from '@/components/ui/pagination';
import type { Glosa } from '@/types';

export const metadata: Metadata = {
  title: 'Glosas | FinHealth',
  description: 'Gerencie as glosas e recursos',
};

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string; tab?: string }>;
}

async function getGlosasData(page: number, tab: string) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  // Build filtered query based on tab
  let query = supabase
    .from('glosas')
    .select(`
      *,
      medical_account:medical_accounts(account_number)
    `, { count: 'exact' })
    .order('priority_score', { ascending: false });

  if (tab === 'pending') {
    query = query.eq('appeal_status', 'pending');
  } else if (tab === 'in_progress') {
    query = query.in('appeal_status', ['in_progress', 'sent']);
  } else if (tab === 'resolved') {
    query = query.in('appeal_status', ['accepted', 'rejected']);
  }

  const { data: glosas, count } = await query.range(from, from + PAGE_SIZE - 1);

  // Get counts for each tab (separate queries for accurate totals)
  const [pendingRes, inProgressRes, resolvedRes, allRes] = await Promise.all([
    supabase.from('glosas').select('id', { count: 'exact', head: true }).eq('appeal_status', 'pending'),
    supabase.from('glosas').select('id', { count: 'exact', head: true }).in('appeal_status', ['in_progress', 'sent']),
    supabase.from('glosas').select('id', { count: 'exact', head: true }).in('appeal_status', ['accepted', 'rejected']),
    supabase.from('glosas').select('id', { count: 'exact', head: true }),
  ]);

  return {
    glosas: (glosas || []) as Glosa[],
    total: count || 0,
    counts: {
      pending: pendingRes.count || 0,
      inProgress: inProgressRes.count || 0,
      resolved: resolvedRes.count || 0,
      all: allRes.count || 0,
    },
  };
}

export default async function GlosasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const tab = params.tab || 'pending';
  const { glosas, total, counts } = await getGlosasData(page, tab);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Glosas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as glosas e recursos
        </p>
      </div>

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" asChild>
            <a href={`/glosas?tab=pending`}>Pendentes ({counts.pending})</a>
          </TabsTrigger>
          <TabsTrigger value="in_progress" asChild>
            <a href={`/glosas?tab=in_progress`}>Em Recurso ({counts.inProgress})</a>
          </TabsTrigger>
          <TabsTrigger value="resolved" asChild>
            <a href={`/glosas?tab=resolved`}>Resolvidas ({counts.resolved})</a>
          </TabsTrigger>
          <TabsTrigger value="all" asChild>
            <a href={`/glosas?tab=all`}>Todas ({counts.all})</a>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} forceMount>
          <GlosasTable glosas={glosas} />
        </TabsContent>
      </Tabs>

      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
