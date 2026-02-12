'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Shield, Copy, Check } from 'lucide-react';
import { useSWRFetch } from '@/hooks/useSWRFetch';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  finance_manager: 'Gestor Financeiro',
  auditor: 'Auditor',
  tiss_operator: 'Operador TISS',
};

interface UsersResponse {
  success: boolean;
  data: UserProfile[];
}

const roleVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  admin: 'destructive',
  finance_manager: 'default',
  auditor: 'secondary',
  tiss_operator: 'outline',
};

interface CreatedCredentials {
  email: string;
  tempPassword: string;
}

export function UserManagement() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('finance_manager');
  const [submitting, setSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data, error: fetchError, isLoading: loading, mutate } = useSWRFetch<UsersResponse>('/api/users');
  const users = data?.data ?? [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      });
      const json = await res.json();

      if (json.success) {
        setCredentials({ email: inviteEmail, tempPassword: json.tempPassword });
        setShowInvite(false);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('finance_manager');
        mutate();
      } else {
        toast({ title: json.error || 'Erro ao convidar usuario', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao convidar usuario', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.tempPassword);
      setCopied(true);
      toast({ title: 'Senha copiada' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Falha ao copiar', variant: 'destructive' });
    }
  };

  const handleCloseCredentials = () => {
    setCredentials(null);
    setCopied(false);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();

      if (json.success) {
        toast({ title: 'Perfil atualizado com sucesso' });
        setEditingRole(null);
        mutate();
      } else {
        toast({ title: json.error || 'Erro ao atualizar perfil', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deseja realmente desativar este usuario?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        toast({ title: 'Usuario desativado' });
        mutate();
      } else {
        toast({ title: json.error || 'Erro ao desativar usuario', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao desativar usuario', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <p className="text-sm text-muted-foreground">{users.length} usuarios cadastrados</p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuario
        </Button>
      </div>

      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convidar novo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome</Label>
                <Input
                  id="invite-name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Perfil</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="finance_manager">Gestor Financeiro</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="tiss_operator">Operador TISS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Convidar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Credential dialog after successful invite */}
      <Dialog open={!!credentials} onOpenChange={(open) => { if (!open) handleCloseCredentials(); }}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Usuario criado com sucesso</DialogTitle>
            <DialogDescription>
              Compartilhe essas credenciais com o usuario. Ele deve alterar a senha no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                  {credentials.email}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Senha temporaria</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    {credentials.tempPassword}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyPassword}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta senha so sera exibida uma vez. Copie e envie ao usuario antes de fechar.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleCloseCredentials}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultimo Acesso</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : fetchError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive py-8">
                    Erro ao carregar usuarios. Verifique suas permissoes.
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum usuario encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingRole === user.id ? (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(val) => handleUpdateRole(user.id, val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="finance_manager">Gestor Financeiro</SelectItem>
                            <SelectItem value="auditor">Auditor</SelectItem>
                            <SelectItem value="tiss_operator">Operador TISS</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={roleVariants[user.role] || 'outline'}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'default' : 'destructive'}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRole(editingRole === user.id ? null : user.id)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      {user.active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          Desativar
                        </Button>
                      )}
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
