import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlosasTable } from '@/components/glosas';
import type { Glosa } from '@/types';

async function getGlosasData() {
  const supabase = await createClient();

  const { data: glosas } = await supabase
    .from('glosas')
    .select(`
      *,
      medical_account:medical_accounts(account_number)
    `)
    .order('priority_score', { ascending: false })
    .limit(100);

  return (glosas || []) as Glosa[];
}

export default async function GlosasPage() {
  const glosas = await getGlosasData();

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
    </div>
  );
}
