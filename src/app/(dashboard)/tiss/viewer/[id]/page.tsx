import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Visualizador TISS | FinHealth',
  description: 'Visualizacao de guia TISS',
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { TissXmlActions } from '@/components/tiss/TissXmlActions';
import type { MedicalAccount } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAccountData(id: string) {
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('medical_accounts')
    .select('*')
    .eq('id', id)
    .single();

  return account as MedicalAccount | null;
}

export default async function TissViewerPage({ params }: PageProps) {
  const { id } = await params;
  const account = await getAccountData(id);

  if (!account || !account.tiss_xml) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tiss">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            Guia {account.tiss_guide_number}
          </h1>
          <p className="text-muted-foreground">
            Visualizacao do XML TISS
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={
              account.tiss_validation_status === 'valid'
                ? 'default'
                : 'secondary'
            }
          >
            {account.tiss_validation_status || 'Pendente'}
          </Badge>
          <TissXmlActions xml={account.tiss_xml!} guideNumber={account.tiss_guide_number} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>XML TISS</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[600px] overflow-auto rounded-lg bg-muted p-4 text-sm">
            <code>{account.tiss_xml}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
