'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

export function Pagination({ total, pageSize, currentPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `${pathname}?${params.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {total} registros &middot; Pagina {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" asChild disabled={currentPage <= 1}>
          <Link href={buildHref(currentPage - 1)} aria-disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        {start > 1 && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(1)}>1</Link>
            </Button>
            {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
          </>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? 'default' : 'outline'}
            size="sm"
            asChild={p !== currentPage}
          >
            {p === currentPage ? <span>{p}</span> : <Link href={buildHref(p)}>{p}</Link>}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(totalPages)}>{totalPages}</Link>
            </Button>
          </>
        )}
        <Button variant="outline" size="icon" asChild disabled={currentPage >= totalPages}>
          <Link href={buildHref(currentPage + 1)} aria-disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
