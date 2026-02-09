'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  contas: 'Contas Médicas',
  nova: 'Nova Conta',
  glosas: 'Glosas',
  pagamentos: 'Pagamentos',
  tiss: 'TISS',
  sus: 'SUS',
  bpa: 'BPA',
  aih: 'AIH',
  sigtap: 'SIGTAP',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  admin: 'Admin',
  usuarios: 'Usuários',
  auditoria: 'Auditoria',
  operadoras: 'Operadoras',
  pacientes: 'Pacientes',
  upload: 'Upload',
  validacao: 'Validação',
  conciliacao: 'Conciliação',
  faturamento: 'Faturamento',
  operadora: 'Por Operadora',
};

function getLabel(segment: string): string {
  return segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't render on dashboard root
  if (!pathname || pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items with paths
  const items = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    return {
      label: getLabel(segment),
      path,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {item.isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.path}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
