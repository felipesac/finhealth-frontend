'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Insurer {
  id: string;
  ans_code: string;
  name: string;
  cnpj: string | null;
  tiss_version: string;
  contact_email: string | null;
  active: boolean;
  created_at: string;
}

export function InsurerManagement({ initialInsurers }: { initialInsurers: Insurer[] }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [ansCode, setAnsCode] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ans_code: ansCode, cnpj: cnpj || undefined, contact_email: email || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Operadora cadastrada com sucesso' });
        setShowForm(false);
        setName(''); setAnsCode(''); setCnpj(''); setEmail('');
        router.refresh();
      } else {
        toast({ title: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao cadastrar operadora', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initialInsurers.length} operadoras cadastradas</p>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Operadora
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cadastrar Operadora</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Codigo ANS</Label>
                <Input value={ansCode} onChange={(e) => setAnsCode(e.target.value)} maxLength={6} required />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} maxLength={14} />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cadastrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>ANS</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>TISS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialInsurers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma operadora</TableCell>
                </TableRow>
              ) : (
                initialInsurers.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium">{ins.name}</TableCell>
                    <TableCell>{ins.ans_code}</TableCell>
                    <TableCell>{ins.cnpj || '-'}</TableCell>
                    <TableCell>{ins.tiss_version}</TableCell>
                    <TableCell>
                      <Badge variant={ins.active ? 'default' : 'destructive'}>{ins.active ? 'Ativa' : 'Inativa'}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
