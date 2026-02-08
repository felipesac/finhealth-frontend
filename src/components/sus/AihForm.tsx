'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AihForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [numeroAih, setNumeroAih] = useState('');
  const [procedimentoPrincipal, setProcedimentoPrincipal] = useState('');
  const [procedimentoSecundario, setProcedimentoSecundario] = useState('');
  const [dataInternacao, setDataInternacao] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [valor, setValor] = useState(0);
  const [tipoAih, setTipoAih] = useState<string>('1');
  const [cnes, setCnes] = useState('');
  const [cboMedico, setCboMedico] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/sus/aih', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_aih: numeroAih,
          procedimento_principal: procedimentoPrincipal,
          procedimento_secundario: procedimentoSecundario || undefined,
          data_internacao: dataInternacao,
          data_saida: dataSaida || undefined,
          valor,
          tipo_aih: tipoAih,
          cnes,
          cbo_medico: cboMedico || undefined,
          diarias: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar AIH');

      toast({ title: 'AIH criada com sucesso' });
      router.push('/sus/aih');
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro ao criar AIH',
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
        <CardTitle>Nova AIH</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numero_aih">Numero AIH</Label>
              <Input
                id="numero_aih"
                value={numeroAih}
                onChange={(e) => setNumeroAih(e.target.value)}
                placeholder="0000000000000"
                maxLength={13}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_aih">Tipo AIH</Label>
              <Select value={tipoAih} onValueChange={setTipoAih}>
                <SelectTrigger id="tipo_aih">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tipo 1 - Normal</SelectItem>
                  <SelectItem value="5">Tipo 5 - Longa Permanencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnes_aih">CNES</Label>
              <Input
                id="cnes_aih"
                value={cnes}
                onChange={(e) => setCnes(e.target.value)}
                placeholder="0000000"
                maxLength={7}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proc_principal">Procedimento Principal (SIGTAP)</Label>
              <Input
                id="proc_principal"
                value={procedimentoPrincipal}
                onChange={(e) => setProcedimentoPrincipal(e.target.value)}
                placeholder="0301010072"
                maxLength={20}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proc_secundario">Procedimento Secundario</Label>
              <Input
                id="proc_secundario"
                value={procedimentoSecundario}
                onChange={(e) => setProcedimentoSecundario(e.target.value)}
                placeholder="Opcional"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cbo_medico">CBO Medico</Label>
              <Input
                id="cbo_medico"
                value={cboMedico}
                onChange={(e) => setCboMedico(e.target.value)}
                placeholder="225125"
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_internacao">Data Internacao</Label>
              <Input
                id="data_internacao"
                type="date"
                value={dataInternacao}
                onChange={(e) => setDataInternacao(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_saida">Data Saida</Label>
              <Input
                id="data_saida"
                type="date"
                value={dataSaida}
                onChange={(e) => setDataSaida(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="valor_aih">Valor (R$)</Label>
              <Input
                id="valor_aih"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                min={0}
                required
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
              Salvar AIH
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
