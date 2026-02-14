'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { susBpaSchema, type SusBpaInput } from '@/lib/validations';

export function BpaForm() {
  const router = useRouter();

  const form = useForm<SusBpaInput>({
    resolver: zodResolver(susBpaSchema),
    defaultValues: {
      cnes: '',
      competencia: '',
      cbo: '',
      procedimento: '',
      quantidade: 1,
      cnpj_prestador: '',
    },
  });

  const onSubmit = async (values: SusBpaInput) => {
    try {
      const res = await fetch('/api/sus/bpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          cnpj_prestador: values.cnpj_prestador || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar BPA');

      toast({ title: 'BPA criado com sucesso' });
      router.push('/sus/bpa');
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro ao criar BPA',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo BPA</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competencia</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cbo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CBO</FormLabel>
                    <FormControl>
                      <Input placeholder="225125" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="procedimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codigo Procedimento (SIGTAP)</FormLabel>
                    <FormControl>
                      <Input placeholder="0301010072" maxLength={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj_prestador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ Prestador</FormLabel>
                    <FormControl>
                      <Input placeholder="00000000000000" maxLength={14} {...field} />
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
                Salvar BPA
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
