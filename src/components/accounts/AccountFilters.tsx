'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import type { HealthInsurer } from '@/types';

interface AccountFiltersProps {
  insurers: HealthInsurer[];
}

export function AccountFilters({ insurers }: AccountFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const status = searchParams.get('status') || 'all';
  const type = searchParams.get('type') || 'all';
  const insurerId = searchParams.get('insurerId') || 'all';
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilter('search', debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname, searchParams]);

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por numero..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => updateFilter('status', value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="validated">Validada</SelectItem>
          <SelectItem value="sent">Enviada</SelectItem>
          <SelectItem value="paid">Paga</SelectItem>
          <SelectItem value="glosa">Glosada</SelectItem>
          <SelectItem value="appeal">Em Recurso</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={type}
        onValueChange={(value) => updateFilter('type', value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="internacao">Internacao</SelectItem>
          <SelectItem value="ambulatorial">Ambulatorial</SelectItem>
          <SelectItem value="sadt">SADT</SelectItem>
          <SelectItem value="honorarios">Honorarios</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={insurerId}
        onValueChange={(value) => updateFilter('insurerId', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Operadora" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {insurers.map((insurer) => (
            <SelectItem key={insurer.id} value={insurer.id}>
              {insurer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="icon" onClick={resetFilters} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  );
}
