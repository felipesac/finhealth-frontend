'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

function getLabel(segment: string, segmentLabels: Record<string, string>): string {
  return segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('breadcrumbs');

  // Don't render on dashboard root
  if (!pathname || pathname === '/dashboard') {
    return null;
  }

  const segmentLabels: Record<string, string> = {
    dashboard: t('dashboard'),
    contas: t('contas'),
    nova: t('nova'),
    glosas: t('glosas'),
    pagamentos: t('pagamentos'),
    tiss: t('tiss'),
    sus: t('sus'),
    bpa: t('bpa'),
    aih: t('aih'),
    sigtap: t('sigtap'),
    relatorios: t('relatorios'),
    configuracoes: t('configuracoes'),
    admin: t('admin'),
    usuarios: t('usuarios'),
    auditoria: t('auditoria'),
    operadoras: t('operadoras'),
    pacientes: t('pacientes'),
    upload: t('upload'),
    validacao: t('validacao'),
    conciliacao: t('conciliacao'),
    faturamento: t('faturamento'),
    operadora: t('operadora'),
    lotes: t('lotes'),
    certificados: t('certificados'),
    remessa: t('remessa'),
    inadimplencia: t('inadimplencia'),
  };

  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items with paths
  const items = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    return {
      label: getLabel(segment, segmentLabels),
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
            <span className="sr-only">{t('home')}</span>
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
