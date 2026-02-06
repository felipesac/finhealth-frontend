'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const dataTypes = [
  { id: 'accounts', label: 'Contas Medicas', description: 'Todas as contas e procedimentos' },
  { id: 'glosas', label: 'Glosas', description: 'Glosas e status de recursos' },
  { id: 'payments', label: 'Pagamentos', description: 'Historico de pagamentos recebidos' },
  { id: 'patients', label: 'Pacientes', description: 'Cadastro de pacientes' },
  { id: 'insurers', label: 'Operadoras', description: 'Operadoras de saude cadastradas' },
];

export default function ExportarPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['accounts']);
  const [format] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: 'Selecione pelo menos um tipo de dado',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          types: selectedTypes,
          format,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha na exportacao');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `finhealth-export.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportacao concluida',
        description: `Arquivo CSV gerado com sucesso`,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro na exportacao',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/relatorios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Exportar Dados</h1>
          <p className="text-muted-foreground">
            Exporte dados do sistema para Excel ou PDF
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Selecione os Dados</CardTitle>
            <CardDescription>
              Escolha quais tipos de dados deseja exportar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataTypes.map((type) => (
              <div key={type.id} className="flex items-start space-x-3">
                <Checkbox
                  id={type.id}
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => toggleType(type.id)}
                />
                <div className="space-y-1">
                  <Label htmlFor={type.id} className="font-medium cursor-pointer">
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Periodo</CardTitle>
              <CardDescription>
                Defina o periodo dos dados a serem exportados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">Data Inicial</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">Data Final</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formato do Arquivo</CardTitle>
              <CardDescription>
                Escolha o formato de exportacao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                CSV (.csv)
              </div>

              <Button
                className="w-full"
                onClick={handleExport}
                disabled={exporting || selectedTypes.length === 0}
              >
                {exporting ? (
                  'Exportando...'
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dados
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
