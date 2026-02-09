'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CertificateUpload } from '@/components/certificates/CertificateUpload';

export default function ConfiguracoesPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || '');
        setName(data.user.user_metadata?.name || '');
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name },
      });
      if (error) throw error;
      toast({ title: 'Perfil atualizado com sucesso' });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({ title: 'Erro ao salvar perfil', description: error.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: 'Digite a senha atual', variant: 'destructive' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'A nova senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createClient();

      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: 'Senha atual incorreta', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      toast({ title: 'Senha alterada com sucesso' });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Configuracoes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as configuracoes do sistema
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Atualize suas informacoes pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alteracoes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguranca</CardTitle>
            <CardDescription>
              Altere sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificacoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notificacoes por email</p>
                <p className="text-xs text-muted-foreground">Receba alertas por email</p>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notificacoes push</p>
                <p className="text-xs text-muted-foreground">Receba notificacoes push no navegador</p>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TISS / SUS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tiss-version">Versao TISS</Label>
                <Input id="tiss-version" defaultValue="3.05.00" disabled />
                <p className="text-xs text-muted-foreground">Versao do padrao TISS em uso</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnes">CNES Padrao</Label>
                <Input id="cnes" placeholder="0000000" disabled />
                <p className="text-xs text-muted-foreground">Codigo CNES do estabelecimento</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Configuracoes TISS/SUS serao editaveis em versoes futuras.</p>
          </CardContent>
        </Card>

        <CertificateUpload />
      </div>
    </div>
  );
}
