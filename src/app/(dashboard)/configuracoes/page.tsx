'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CertificateUpload } from '@/components/certificates/CertificateUpload';
import {
  useTissSettings,
  useNotificationPreferences,
  useUpdateTissSettings,
  useUpdateNotificationPreferences,
} from '@/hooks/queries/use-settings';

interface NotificationPreferences {
  email_glosas: boolean;
  email_pagamentos: boolean;
  email_contas: boolean;
  push_enabled: boolean;
}

export default function ConfiguracoesPage() {
  const t = useTranslations('settings');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [tissVersion, setTissVersion] = useState('3.05.00');
  const [cnes, setCnes] = useState('');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_glosas: true,
    email_pagamentos: true,
    email_contas: false,
    push_enabled: false,
  });

  const { data: tissData } = useTissSettings();
  const { data: notifData } = useNotificationPreferences();
  const updateTiss = useUpdateTissSettings();
  const updateNotifPrefs = useUpdateNotificationPreferences();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || '');
        setName(data.user.user_metadata?.name || '');
      }
    });
  }, []);

  useEffect(() => {
    if (tissData) {
      setTissVersion(tissData.tiss_version || '3.05.00');
      setCnes(tissData.cnes || '');
    }
  }, [tissData]);

  useEffect(() => {
    if (notifData) {
      setNotifPrefs(notifData);
    }
  }, [notifData]);

  const handleSaveNotifications = useCallback(async (prefs: NotificationPreferences) => {
    try {
      await updateNotifPrefs.mutateAsync(prefs);
      toast({ title: t('notifUpdated') });
    } catch {
      toast({ title: t('notifError'), variant: 'destructive' });
    }
  }, [t, updateNotifPrefs]);

  const subscribePush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast({ title: t('pushNotConfigured'), variant: 'destructive' });
        return false;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      await fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      return true;
    } catch {
      toast({ title: t('pushError'), description: t('pushErrorDesc'), variant: 'destructive' });
      return false;
    }
  }, [t]);

  const unsubscribePush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      await fetch('/api/notifications/push-subscribe', { method: 'DELETE' });
    } catch {
      // silent
    }
  }, []);

  const toggleNotifPref = async (key: keyof NotificationPreferences) => {
    const newValue = !notifPrefs[key];

    if (key === 'push_enabled') {
      if (newValue) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          toast({ title: t('pushNotSupported'), variant: 'destructive' });
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({ title: t('pushDenied'), variant: 'destructive' });
          return;
        }
        const subscribed = await subscribePush();
        if (!subscribed) return;
      } else {
        await unsubscribePush();
      }
    }

    const updated = { ...notifPrefs, [key]: newValue };
    setNotifPrefs(updated);
    handleSaveNotifications(updated);
  };

  const handleSaveTiss = async () => {
    if (cnes && !/^\d{7}$/.test(cnes)) {
      toast({ title: t('cnesValidation'), variant: 'destructive' });
      return;
    }
    try {
      await updateTiss.mutateAsync({ tiss_version: tissVersion, cnes });
      toast({ title: t('tissUpdated') });
    } catch {
      toast({ title: t('tissError'), variant: 'destructive' });
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
      toast({ title: t('profileUpdated') });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({ title: t('profileError'), description: error.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: t('enterCurrentPassword'), variant: 'destructive' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: t('passwordMinLength'), variant: 'destructive' });
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
        toast({ title: t('wrongPassword'), variant: 'destructive' });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      toast({ title: t('passwordChanged') });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({ title: t('passwordError'), description: error.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
            <CardDescription>
              {t('profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input id="name" placeholder={t('namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" value={email} disabled />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('security')}</CardTitle>
            <CardDescription>
              {t('securityDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('currentPassword')}</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('newPassword')}</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('changePassword')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notifications')}</CardTitle>
            <CardDescription>
              {t('notificationsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-glosas" className="text-sm font-medium">{t('notifGlosas')}</Label>
                <p className="text-xs text-muted-foreground">{t('notifGlosasDesc')}</p>
              </div>
              <Switch
                id="notif-glosas"
                checked={notifPrefs.email_glosas}
                onCheckedChange={() => toggleNotifPref('email_glosas')}
                disabled={updateNotifPrefs.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-pagamentos" className="text-sm font-medium">{t('notifPayments')}</Label>
                <p className="text-xs text-muted-foreground">{t('notifPaymentsDesc')}</p>
              </div>
              <Switch
                id="notif-pagamentos"
                checked={notifPrefs.email_pagamentos}
                onCheckedChange={() => toggleNotifPref('email_pagamentos')}
                disabled={updateNotifPrefs.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-contas" className="text-sm font-medium">{t('notifAccounts')}</Label>
                <p className="text-xs text-muted-foreground">{t('notifAccountsDesc')}</p>
              </div>
              <Switch
                id="notif-contas"
                checked={notifPrefs.email_contas}
                onCheckedChange={() => toggleNotifPref('email_contas')}
                disabled={updateNotifPrefs.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-push" className="text-sm font-medium">{t('notifPush')}</Label>
                <p className="text-xs text-muted-foreground">{t('notifPushDesc')}</p>
              </div>
              <Switch
                id="notif-push"
                checked={notifPrefs.push_enabled}
                onCheckedChange={() => toggleNotifPref('push_enabled')}
                disabled={updateNotifPrefs.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('tissSus')}</CardTitle>
            <CardDescription>
              {t('tissSusDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tiss-version">{t('tissVersion')}</Label>
                <Input
                  id="tiss-version"
                  value={tissVersion}
                  onChange={(e) => setTissVersion(e.target.value)}
                  placeholder="3.05.00"
                />
                <p className="text-xs text-muted-foreground">{t('tissVersionHelp')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnes">{t('cnes')}</Label>
                <Input
                  id="cnes"
                  value={cnes}
                  onChange={(e) => setCnes(e.target.value)}
                  placeholder="0000000"
                  maxLength={7}
                />
                <p className="text-xs text-muted-foreground">{t('cnesHelp')}</p>
              </div>
            </div>
            <Button onClick={handleSaveTiss} disabled={updateTiss.isPending}>
              {updateTiss.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveTissConfig')}
            </Button>
          </CardContent>
        </Card>

        <CertificateUpload />
      </div>
    </div>
  );
}
