'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface SigtapResult {
  id: string;
  codigo_sigtap: string;
  nome: string;
  competencia: string;
  valor_ambulatorial: number;
  valor_hospitalar: number;
  complexidade?: string;
  modalidade?: string;
}

export function SigtapSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SigtapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/sus/bpa?search_sigtap=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (data.success && data.procedures) {
        setResults(data.procedures);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Busca SIGTAP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por codigo ou nome do procedimento..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {searched && !loading && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum procedimento encontrado para &quot;{query}&quot;
          </p>
        )}

        {results.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Competencia</TableHead>
                  <TableHead className="text-right">Ambulatorial</TableHead>
                  <TableHead className="text-right">Hospitalar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((proc) => (
                  <TableRow key={proc.id}>
                    <TableCell className="font-mono text-sm">
                      {proc.codigo_sigtap}
                    </TableCell>
                    <TableCell>{proc.nome}</TableCell>
                    <TableCell>{proc.competencia}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(proc.valor_ambulatorial)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(proc.valor_hospitalar)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
