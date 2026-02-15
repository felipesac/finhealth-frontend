'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TussProcedure {
  id: string;
  code: string;
  description: string;
  chapter?: string;
  group_name?: string;
  procedure_type?: string;
  unit_price: number;
}

interface TussAutocompleteProps {
  onSelect: (procedure: TussProcedure) => void;
  placeholder?: string;
  className?: string;
}

export function TussAutocomplete({
  onSelect,
  placeholder = 'Buscar procedimento por codigo ou nome...',
  className,
}: TussAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TussProcedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const searchProcedures = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tuss?search=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchProcedures(search);
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, searchProcedures]);

  const handleSelect = (procedure: TussProcedure) => {
    onSelect(procedure);
    setSearch('');
    setResults([]);
    setOpen(false);
  };

  const procedureTypeColors: Record<string, string> = {
    consulta: 'bg-blue-100 text-blue-800',
    exame: 'bg-green-100 text-green-800',
    cirurgia: 'bg-red-100 text-red-800',
    terapia: 'bg-purple-100 text-purple-800',
    procedimento: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setSearch('');
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {open && (search.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <ScrollArea className="max-h-[300px]">
              <div className="p-1">
                {results.map((procedure) => (
                  <button
                    key={procedure.id}
                    className="w-full rounded-md p-2 text-left hover:bg-muted transition-colors"
                    onClick={() => handleSelect(procedure)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {procedure.code}
                          </span>
                          {procedure.procedure_type && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                procedureTypeColors[procedure.procedure_type]
                              )}
                            >
                              {procedure.procedure_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {procedure.description}
                        </p>
                        {procedure.group_name && (
                          <p className="text-xs text-muted-foreground">
                            {procedure.group_name}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                        {formatCurrency(procedure.unit_price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : search.length >= 2 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Nenhum procedimento encontrado
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
