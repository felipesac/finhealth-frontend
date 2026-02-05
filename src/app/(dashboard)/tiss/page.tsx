import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { TissGuidesList } from '@/components/tiss';
import { Upload } from 'lucide-react';
import type { MedicalAccount } from '@/types';

async function getTissData() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select('*')
    .not('tiss_guide_number', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return (accounts || []) as MedicalAccount[];
}

export default async function TissPage() {
  const accounts = await getTissData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TISS</h1>
          <p className="text-muted-foreground">
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
    </div>
  );
}
