'use client';

import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TissXmlActionsProps {
  xml: string;
  guideNumber?: string;
}

export function TissXmlActions({ xml, guideNumber }: TissXmlActionsProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      toast({ title: 'XML copiado para a area de transferencia' });
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiss-guia-${guideNumber || 'sem-numero'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleDownload}>
        <Download className="h-4 w-4" />
      </Button>
    </>
  );
}
