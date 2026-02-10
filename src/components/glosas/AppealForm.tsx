'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Send, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const appealFormSchema = z.object({
  text: z.string().trim().min(1, 'Texto do recurso obrigatorio'),
});

type AppealFormValues = z.infer<typeof appealFormSchema>;

interface AppealFormProps {
  glosaId: string;
  initialText: string;
  appealStatus: string;
}

export function AppealForm({ glosaId, initialText, appealStatus }: AppealFormProps) {
  const router = useRouter();

  const isSent = appealStatus === 'sent' || appealStatus === 'accepted' || appealStatus === 'rejected';

  const form = useForm<AppealFormValues>({
    resolver: zodResolver(appealFormSchema),
    defaultValues: { text: initialText },
  });

  const handleAction = async (action: 'save_draft' | 'submit') => {
    const isValid = await form.trigger('text');
    if (!isValid) {
      if (action === 'save_draft') {
        toast({ title: 'Digite o texto do recurso', variant: 'destructive' });
      }
      return;
    }

    const text = form.getValues('text');

    try {
      const res = await fetch('/api/appeals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glosaId, text, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (action === 'save_draft' ? 'Erro ao salvar rascunho' : 'Erro ao enviar recurso'));

      toast({
        title: action === 'save_draft' ? 'Rascunho salvo com sucesso' : 'Recurso enviado com sucesso',
      });
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: action === 'save_draft' ? 'Erro ao salvar rascunho' : 'Erro ao enviar recurso',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
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
        <Form {...form}>
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Digite a fundamentacao do recurso..."
                    rows={8}
                    disabled={isSent}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
        {!isSent && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction('save_draft')}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Rascunho
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar Recurso
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar envio do recurso</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja enviar o recurso? Apos o envio, o texto nao podera ser editado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleAction('submit')}>
                    Confirmar Envio
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
