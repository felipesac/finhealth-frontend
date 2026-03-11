'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';

interface PaymentUploadProps {
  insurers: { id: string; name: string }[];
}

export function PaymentUpload({ insurers }: PaymentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [insurerId, setInsurerId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'ofx') {
        toast({ title: 'Formato invalido. Use CSV ou OFX.', variant: 'destructive' });
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const content = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();

      const res = await fetch('/api/payments/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fileType: ext,
          healthInsurerId: insurerId || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setResult(json.data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast({ title: json.message });
      } else {
        toast({ title: json.error || 'Erro ao importar', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao processar arquivo', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Importar Pagamentos</CardTitle>
        <CardDescription>
          Importe pagamentos a partir de um arquivo CSV ou OFX do extrato bancario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment-file">Arquivo (CSV ou OFX)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                {file ? file.name : 'Selecionar arquivo'}
              </Button>
              <input
                ref={fileInputRef}
                id="payment-file"
                type="file"
                accept=".csv,.ofx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-insurer">Operadora (opcional)</Label>
            <Select value={insurerId} onValueChange={setInsurerId}>
              <SelectTrigger id="upload-insurer">
                <SelectValue placeholder="Selecionar operadora" />
              </SelectTrigger>
              <SelectContent>
                {insurers.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar
          </Button>

          {result && (
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {result.count} pagamentos importados
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
