import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TissUploadForm } from '@/components/tiss';
import { ArrowLeft } from 'lucide-react';

export default function TissUploadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tiss">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload de Guia TISS</h1>
          <p className="text-muted-foreground">
            Envie um arquivo XML para validacao
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <TissUploadForm />
      </div>
    </div>
  );
}
