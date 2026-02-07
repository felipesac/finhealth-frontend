'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AppealFormProps {
  glosaId: string;
  initialText: string;
  appealStatus: string;
}

export function AppealForm({ glosaId, initialText, appealStatus }: AppealFormProps) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSent = appealStatus === 'sent' || appealStatus === 'accepted' || appealStatus === 'rejected';

  const handleSaveDraft = async () => {
    if (!text.trim()) {
      toast({ title: 'Digite o texto do recurso', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/appeals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glosaId, text, action: 'save_draft' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar rascunho');

      toast({ title: 'Rascunho salvo com sucesso' });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro ao salvar rascunho',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!text.trim()) {
      toast({ title: 'Digite o texto do recurso antes de enviar', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/appeals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glosaId, text, action: 'submit' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar recurso');

      toast({ title: 'Recurso enviado com sucesso' });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro ao enviar recurso',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Texto do Recurso</CardTitle>
        <CardDescription>
          {isSent ? 'Recurso ja enviado' : 'Edite o texto do recurso antes de enviar'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Digite a fundamentacao do recurso..."
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSent}
        />
        {!isSent && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving || submitting}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Rascunho
            </Button>
            <Button onClick={handleSubmitAppeal} disabled={saving || submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Recurso
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
