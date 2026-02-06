import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlosasTable } from '@/components/glosas';
import { Pagination } from '@/components/ui/pagination';
import type { Glosa } from '@/types';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getGlosasData(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  const { data: glosas, count } = await supabase
    .from('glosas')
    .select(`
      *,
      medical_account:medical_accounts(account_number)
    `, { count: 'exact' })
    .order('priority_score', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return {
    glosas: (glosas || []) as Glosa[],
    total: count || 0,
  };
}

export default async function GlosasPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const { glosas, total } = await getGlosasData(page);

  const pendingGlosas = glosas.filter((g) => g.appeal_status === 'pending');
  const inProgressGlosas = glosas.filter((g) =>
    ['in_progress', 'sent'].includes(g.appeal_status)
  );
  const resolvedGlosas = glosas.filter((g) =>
    ['accepted', 'rejected'].includes(g.appeal_status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Glosas</h1>
        <p className="text-muted-foreground">
          Gerencie as glosas e recursos
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingGlosas.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Recurso ({inProgressGlosas.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidas ({resolvedGlosas.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({glosas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <GlosasTable glosas={pendingGlosas} />
        </TabsContent>
        <TabsContent value="in_progress">
          <GlosasTable glosas={inProgressGlosas} />
        </TabsContent>
        <TabsContent value="resolved">
          <GlosasTable glosas={resolvedGlosas} />
        </TabsContent>
        <TabsContent value="all">
          <GlosasTable glosas={glosas} />
        </TabsContent>
      </Tabs>

      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
