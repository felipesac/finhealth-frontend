'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BpaForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [cnes, setCnes] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [cbo, setCbo] = useState('');
  const [procedimento, setProcedimento] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [cnpjPrestador, setCnpjPrestador] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/sus/bpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnes,
          competencia,
          cbo,
          procedimento,
          quantidade,
          cnpj_prestador: cnpjPrestador || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar BPA');

      toast({ title: 'BPA criado com sucesso' });
      router.push('/sus/bpa');
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro ao criar BPA',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo BPA</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnes">CNES</Label>
              <Input
                id="cnes"
                value={cnes}
                onChange={(e) => setCnes(e.target.value)}
                placeholder="0000000"
                maxLength={7}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competencia">Competencia</Label>
              <Input
                id="competencia"
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cbo">CBO</Label>
              <Input
                id="cbo"
                value={cbo}
                onChange={(e) => setCbo(e.target.value)}
                placeholder="225125"
                maxLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="procedimento">Codigo Procedimento (SIGTAP)</Label>
              <Input
                id="procedimento"
                value={procedimento}
                onChange={(e) => setProcedimento(e.target.value)}
                placeholder="0301010072"
                maxLength={20}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ Prestador</Label>
              <Input
                id="cnpj"
                value={cnpjPrestador}
                onChange={(e) => setCnpjPrestador(e.target.value)}
                placeholder="00000000000000"
                maxLength={14}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar BPA
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
