'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { susAihSchema } from '@/lib/validations';

type AihFormValues = z.input<typeof susAihSchema>;

export function AihForm() {
  const router = useRouter();

  const form = useForm<AihFormValues>({
    resolver: zodResolver(susAihSchema),
    defaultValues: {
      numero_aih: '',
      procedimento_principal: '',
      procedimento_secundario: '',
      data_internacao: '',
      data_saida: '',
      valor: 0,
      tipo_aih: '1',
      cnes: '',
      cbo_medico: '',
      diarias: 0,
    },
  });

  const onSubmit = async (values: AihFormValues) => {
    try {
      const res = await fetch('/api/sus/aih', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          procedimento_secundario: values.procedimento_secundario || undefined,
          data_saida: values.data_saida || undefined,
          cbo_medico: values.cbo_medico || undefined,
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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova AIH</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numero_aih"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero AIH</FormLabel>
                    <FormControl>
                      <Input placeholder="0000000000000" maxLength={13} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_aih"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo AIH</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Tipo 1 - Normal</SelectItem>
                        <SelectItem value="5">Tipo 5 - Longa Permanencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNES</FormLabel>
                    <FormControl>
                      <Input placeholder="0000000" maxLength={7} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="procedimento_principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento Principal (SIGTAP)</FormLabel>
                    <FormControl>
                      <Input placeholder="0301010072" maxLength={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="procedimento_secundario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento Secundario</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" maxLength={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cbo_medico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CBO Medico</FormLabel>
                    <FormControl>
                      <Input placeholder="225125" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_internacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Internacao</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_saida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Saida</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar AIH
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
