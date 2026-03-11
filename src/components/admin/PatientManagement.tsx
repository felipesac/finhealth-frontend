'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { usePatients, useCreatePatient } from '@/hooks/queries/use-patients';

export function PatientManagement() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const { data, isLoading: loading } = usePatients(page, debouncedSearch);
  const createPatient = useCreatePatient();
  const patients = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const json = await createPatient.mutateAsync({
        name,
        cpf: cpf || undefined,
        birth_date: birthDate || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      if (json.success) {
        toast({ title: 'Paciente cadastrado' });
        setShowForm(false);
        setName(''); setCpf(''); setBirthDate(''); setPhone(''); setEmail('');
      } else {
        toast({ title: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao cadastrar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Paciente
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cadastrar Paciente</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>CPF</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} maxLength={14} /></div>
              <div className="space-y-2"><Label>Data Nascimento</Label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="flex items-end">
                <Button type="submit" disabled={createPatient.isPending} className="w-full">
                  {createPatient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cadastrar
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
                <TableHead>CPF</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : patients.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum paciente encontrado</TableCell></TableRow>
              ) : (
                patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.cpf || '-'}</TableCell>
                    <TableCell>{p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>{p.phone || '-'}</TableCell>
                    <TableCell>{p.email || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Pagina {page} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
