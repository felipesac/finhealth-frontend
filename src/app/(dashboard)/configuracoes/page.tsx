'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CertificateUpload } from '@/components/certificates/CertificateUpload';

interface NotificationPreferences {
  email_glosas: boolean;
  email_pagamentos: boolean;
  email_contas: boolean;
  push_enabled: boolean;
}

export default function ConfiguracoesPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [tissVersion, setTissVersion] = useState('3.05.00');
  const [cnes, setCnes] = useState('');
  const [savingTiss, setSavingTiss] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_glosas: true,
    email_pagamentos: true,
    email_contas: false,
    push_enabled: false,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || '');
        setName(data.user.user_metadata?.name || '');
      }
    });
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setNotifPrefs(res.data);
      })
      .catch(() => {});
    fetch('/api/settings/tiss')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setTissVersion(res.data.tiss_version || '3.05.00');
          setCnes(res.data.cnes || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveNotifications = useCallback(async (prefs: NotificationPreferences) => {
    setSavingNotif(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast({ title: 'Preferencias de notificacao atualizadas' });
    } catch {
      toast({ title: 'Erro ao salvar notificacoes', variant: 'destructive' });
    } finally {
      setSavingNotif(false);
    }
  }, []);

  const toggleNotifPref = (key: keyof NotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    handleSaveNotifications(updated);
  };

  const handleSaveTiss = async () => {
    if (cnes && !/^\d{7}$/.test(cnes)) {
      toast({ title: 'CNES deve ter 7 digitos numericos', variant: 'destructive' });
      return;
    }
    setSavingTiss(true);
    try {
      const res = await fetch('/api/settings/tiss', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiss_version: tissVersion, cnes }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast({ title: 'Configuracoes TISS/SUS atualizadas' });
    } catch {
      toast({ title: 'Erro ao salvar configuracoes TISS', variant: 'destructive' });
    } finally {
      setSavingTiss(false);
    }
  };

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
            <CardDescription>
              Configure quais notificacoes deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-glosas" className="text-sm font-medium">Glosas</Label>
                <p className="text-xs text-muted-foreground">Alertas sobre novas glosas e recursos</p>
              </div>
              <Switch
                id="notif-glosas"
                checked={notifPrefs.email_glosas}
                onCheckedChange={() => toggleNotifPref('email_glosas')}
                disabled={savingNotif}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-pagamentos" className="text-sm font-medium">Pagamentos</Label>
                <p className="text-xs text-muted-foreground">Alertas sobre pagamentos recebidos e conciliacao</p>
              </div>
              <Switch
                id="notif-pagamentos"
                checked={notifPrefs.email_pagamentos}
                onCheckedChange={() => toggleNotifPref('email_pagamentos')}
                disabled={savingNotif}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-contas" className="text-sm font-medium">Contas Medicas</Label>
                <p className="text-xs text-muted-foreground">Alertas sobre mudancas de status nas contas</p>
              </div>
              <Switch
                id="notif-contas"
                checked={notifPrefs.email_contas}
                onCheckedChange={() => toggleNotifPref('email_contas')}
                disabled={savingNotif}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-push" className="text-sm font-medium">Notificacoes push</Label>
                <p className="text-xs text-muted-foreground">Receba notificacoes em tempo real no navegador</p>
              </div>
              <Switch
                id="notif-push"
                checked={notifPrefs.push_enabled}
                onCheckedChange={() => toggleNotifPref('push_enabled')}
                disabled={savingNotif}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TISS / SUS</CardTitle>
            <CardDescription>
              Configuracoes do padrao TISS e identificacao SUS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tiss-version">Versao TISS</Label>
                <Input
                  id="tiss-version"
                  value={tissVersion}
                  onChange={(e) => setTissVersion(e.target.value)}
                  placeholder="3.05.00"
                />
                <p className="text-xs text-muted-foreground">Versao do padrao TISS em uso (ex: 3.05.00, 4.00.00)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnes">CNES Padrao</Label>
                <Input
                  id="cnes"
                  value={cnes}
                  onChange={(e) => setCnes(e.target.value)}
                  placeholder="0000000"
                  maxLength={7}
                />
                <p className="text-xs text-muted-foreground">Codigo CNES do estabelecimento (7 digitos)</p>
              </div>
            </div>
            <Button onClick={handleSaveTiss} disabled={savingTiss}>
              {savingTiss && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configuracoes TISS
            </Button>
          </CardContent>
        </Card>

        <CertificateUpload />
      </div>
    </div>
  );
}
