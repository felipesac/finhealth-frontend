'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreateAccountFormProps {
  patients: { id: string; name: string }[];
  insurers: { id: string; name: string }[];
}

const accountTypeOptions = [
  { value: 'internacao', label: 'Internacao' },
  { value: 'ambulatorial', label: 'Ambulatorial' },
  { value: 'sadt', label: 'SADT' },
  { value: 'honorarios', label: 'Honorarios' },
];

export function CreateAccountForm({ patients, insurers }: CreateAccountFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [accountNumber, setAccountNumber] = useState('');
  const [patientId, setPatientId] = useState('');
  const [healthInsurerId, setHealthInsurerId] = useState('');
  const [accountType, setAccountType] = useState('internacao');
  const [admissionDate, setAdmissionDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          patient_id: patientId,
          health_insurer_id: healthInsurerId,
          account_type: accountType,
          admission_date: admissionDate,
          discharge_date: dischargeDate || undefined,
          total_amount: totalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar conta');

      toast({ title: 'Conta medica criada com sucesso' });
      router.push('/contas');
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro ao criar conta',
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
        <CardTitle>Nova Conta Medica</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account_number">Numero da Conta</Label>
              <Input
                id="account_number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ex: 2024001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo</Label>
              <select
                id="account_type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {accountTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient_id">Paciente</Label>
              <select
                id="patient_id"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Selecione um paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_insurer_id">Operadora</Label>
              <select
                id="health_insurer_id"
                value={healthInsurerId}
                onChange={(e) => setHealthInsurerId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Selecione uma operadora</option>
                {insurers.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission_date">Data de Admissao</Label>
              <Input
                id="admission_date"
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discharge_date">Data de Alta</Label>
              <Input
                id="discharge_date"
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount">Valor Total (R$)</Label>
              <Input
                id="total_amount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
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
              Salvar Conta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
